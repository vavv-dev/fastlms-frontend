import {
  ExamDisplayResponse as DisplayResponse,
  examGetDisplays as getDisplays,
  examUpdateResource as updateResource,
} from '@/api';
import { ThreadDialog } from '@/component/comment';
import { ResourceCard } from '@/component/common/ResourceCard';
import { formatDatetimeLocale, formatDuration, formatRelativeTime } from '@/helper/util';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenu';
import { ReadyDialog } from './ReadyDialog';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('exam');
  const [readyDialogOpen, setReadyDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => setReadyDialogOpen(true)}
        banner={
          <Box sx={{ p: 2, position: 'relative' }}>
            {data.thumbnail && (
              <Box
                sx={{
                  aspectRatio: '16 / 9',
                  backgroundImage: `url(${data.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  m: -2,
                  mb: 1.5,
                }}
              />
            )}
            <Info data={data} />
          </Box>
        }
        score={data.score}
        passed={data.status === 'passed'}
        avatarChildren={[
          t(...formatRelativeTime(data.modified)),
          t('{{ count }} submissions', { count: data.submission_count }),
        ]}
        hideAvatar={hideAvatar}
        footer={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setThreadDialogOpen((prev) => !prev);
              }}
              sx={{ py: 0 }}
            >
              {t('Q&A')}
            </Button>
            {![null, 'passed', 'failed'].includes(data.status) && (
              <Typography
                fontSize="small"
                component="span"
                variant="subtitle2"
                sx={{ fontWeight: 600, mx: 0.5, color: 'success.main' }}
              >
                {t(data.status || '')}
              </Typography>
            )}
          </Box>
        }
        autoColor
        actionMenu={<ActionMenu data={data} />}
        sx={{ '& .card-content': { flexGrow: 0 } }}
        partialUpdateService={updateResource}
        listService={getDisplays}
      />
      {readyDialogOpen && <ReadyDialog open={readyDialogOpen} setOpen={setReadyDialogOpen} id={data.id} />}
      {threadDialogOpen && (
        <ThreadDialog
          open={threadDialogOpen}
          setOpen={setThreadDialogOpen}
          threadProps={{
            url: encodeURIComponent(`${location.origin}/exam/${data.id}`),
            title: data.title,
            owner: data.owner,
            kind: 'exam',
            question: true,
            sticky: true,
          }}
        />
      )}
    </>
  );
};

const Info = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();

  return (
    <TableContainer
      sx={{
        '& tr:first-of-type td': { fontWeight: 600 },
        '& td': { px: '.5em', fontSize: theme.typography.body2, whiteSpace: 'nowrap' },
        '& tr:last-child td': { borderBottom: 'none' },
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>{t('Exam Type')}</TableCell>
            <TableCell>{t(data.exam_kind)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Start')}</TableCell>
            <TableCell>{formatDatetimeLocale(data.start_date)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('End')}</TableCell>
            <TableCell>{data.end_date ? formatDatetimeLocale(data.end_date) : t('N/A')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Exam time')}</TableCell>
            <TableCell>{data.duration ? formatDuration(data.duration) : t('N/A')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Cutoff %')}</TableCell>
            <TableCell>{data.cutoff_percent} %</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ verticalAlign: 'top' }}>{t('Questions')}</TableCell>
            <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'pre !important' }}>
              {Object.entries(data.question_composition)
                .filter(([, v]) => v)
                .reduce((acc, [key, value]) => {
                  acc.push(`${t(key)}: ${value}`);
                  return acc;
                }, [] as string[])
                .join('\n\r')}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
