import { Box, BoxProps, Table, TableBody, TableCell, TableContainer, TableRow, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';

import {
  ExamDisplayResponse as DisplayResponse,
  examGetDisplays as getDisplays,
  examUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatDatetimeLocale, formatDuration, formatRelativeTime } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  bannerPlace?: 'top' | 'bottom';
  sx?: BoxProps['sx'];
}

export const Card = ({ data, hideAvatar, bannerPlace, sx }: Props) => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();

  return (
    <Box>
      <ResourceCard
        resource={data}
        onClick={() => navigate('.', { state: { dialog: data } })}
        bannerPlace={bannerPlace || 'bottom'}
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
            {![null, 'in_progress', 'fail', 'passed'].includes(data.status) && (
              <Typography
                component="span"
                variant="subtitle2"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  p: 1,
                  fontSize: 'small',
                  color: 'error.main',
                  float: 'right',
                }}
              >
                {t(data.status || '')}
              </Typography>
            )}
          </Box>
        }
        score={data.score}
        passed={data.passed}
        inProgress={data.status == 'in_progress'}
        avatarChildren={[t(...formatRelativeTime(data.modified))]}
        hideAvatar={hideAvatar}
        autoColor
        actionMenu={<ActionMenu data={data} />}
        sx={{ ...sx, '& .content-title': { WebkitLineClamp: '1' } }}
        partialUpdateService={updateResource}
        listService={getDisplays}
        bannerBorder={!data.thumbnail}
      />
    </Box>
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
