import { MessageGetMessagesData, MessageGetMessagesResponse, UserMessageResponse, messageGetMessages } from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { calculateReverseIndex, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import { Notifications, NotificationsOutlined } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

export const Notification = () => {
  const { t } = useTranslation('u');
  const user = useAtomValue(userState);

  return (
    <GridInfiniteScrollPage<UserMessageResponse, MessageGetMessagesData>
      pageKey="message"
      orderingOptions={[{ value: 'time', label: t('Recently received') }]}
      apiService={messageGetMessages}
      apiOptions={{ receiverId: user?.id }}
      renderItem={({ data }) => <NotificationTable data={data} />}
      emptyMessage={<EmptyMessage Icon={NotificationsOutlined} message={t('No message found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr' }}
      boxPadding={0}
    />
  );
};

const NotificationTable = ({ data }: { data: MessageGetMessagesResponse[] | undefined }) => {
  const { t } = useTranslation('u');

  if (!data) return null;

  return (
    <TableContainer>
      <Table sx={{ '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' }, '& td': { py: 1, height: '3.5em' } }}>
        <TableHead>
          <TableRow>
            <TableCell align="center">no</TableCell>
            <TableCell>{t('Type')}</TableCell>
            <TableCell>{t('Sender')}</TableCell>
            <TableCell>{t('Title')}</TableCell>
            <TableCell>{t('Received at')}</TableCell>
            <TableCell>{t('Read at')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map((pagination, pageIndex) =>
            pagination.items?.map((row, rowIndex) => (
              <NoticationRow row={row} index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)} key={row.id} />
            )),
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const NoticationRow = ({ row, index }: { row: UserMessageResponse; index: number }) => {
  const { t } = useTranslation('u');

  return (
    <TableRow onClick={() => {}} key={row.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}>
      <TableCell align="center">{index}</TableCell>
      <TableCell>{t(row.action)}</TableCell>
      <TableCell>{row.sender && <WithAvatar variant="small" {...row.sender} />}</TableCell>
      <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
      <TableCell>{t(...formatRelativeTime(row.time))}</TableCell>
      <TableCell>
        {row.read_time ? t(...formatRelativeTime(row.read_time)) : <Notifications fontSize="small" color="error" />}
      </TableCell>
    </TableRow>
  );
};
