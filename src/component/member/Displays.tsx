import {
  MemberDisplayResponse as DisplayResponse,
  MemberGetDisplaysData as GetDisplaysData,
  memberGetDisplays as getDisplays,
} from '@/api';
import { GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { formatDatetimeLocale } from '@/helper/util';
import {
  Box,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { atom, useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenus';

const rosterOnlyState = atom(false);

export const Displays = () => {
  const { t } = useTranslation('member');
  const [rosterOnly, setRosterOnly] = useAtom(rosterOnlyState);

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="account"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'name', label: t('Name asc') },
      ]}
      apiService={getDisplays}
      apiOptions={{ roster: rosterOnly }}
      renderItem={({ data }) => (
        <TableContainer>
          <Table
            sx={{
              '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' },
              '& th:last-of-type, td:last-of-type': { width: '2em' },
              '& td': { py: 1 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>no</TableCell>
                <TableCell>{t('Username')}</TableCell>
                <TableCell>{t('Cohorts')}</TableCell>
                <TableCell>{t('Member data')}</TableCell>
                <TableCell>{t('Memo')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((pagination) =>
                pagination.items?.map((item, i) => (
                  <MemberRow
                    data={item}
                    index={pagination.total - (pagination.page - 1) * pagination.pages - i}
                    key={`${item.username}-${item.id}`}
                  />
                )),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
      extraAction={
        <FormControlLabel
          control={<Switch checked={rosterOnly} onChange={() => setRosterOnly(!rosterOnly)} />}
          label={<Typography variant="subtitle2">{t('Roster only')}</Typography>}
        />
      }
    />
  );
};

const MemberRow = ({ data, index }: { data: DisplayResponse; index: number }) => {
  const theme = useTheme();
  const { t } = useTranslation('member');

  return (
    <TableRow sx={{ bgcolor: !data.id ? theme.palette.action.hover : 'inherit' }}>
      <TableCell>{index}</TableCell>
      <TableCell>
        {data.id ? (
          <WithAvatar {...data} variant="small" />
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography>{data.username}</Typography>
            {data.invited_at && (
              <Typography variant="caption" color="warning">
                {t('Invited at {{ when }}', { when: formatDatetimeLocale(data.invited_at) })}
              </Typography>
            )}
          </Box>
        )}
      </TableCell>
      <TableCell>{data.cohorts}</TableCell>
      <TableCell sx={{ whiteSpace: 'pre-wrap !important', fontSize: '0.8em' }}>
        {Object.entries(data.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')}
      </TableCell>
      <TableCell>{data.memo}</TableCell>
      <TableCell>
        <ActionMenu data={data} />
      </TableCell>
    </TableRow>
  );
};
