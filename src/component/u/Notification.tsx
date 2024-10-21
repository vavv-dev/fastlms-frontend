import { MessageGetMessagesData, MessageGetMessagesResponse, UserMessageResponse, messageGetMessages } from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { notificationState } from '@/component/layout';
import { calculateReverseIndex, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import { Notifications, NotificationsOutlined } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
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
  const [notifications, setNotifications] = useAtom(notificationState);
  const addedRef = useRef<Array<string>>([]);

  useEffect(() => {
    if (!data) return;
    const notificationIds = notifications.map((notification) => notification.id);
    const unreads = data.flatMap((pagination) =>
      pagination.items.filter(
        (row) => !row.read_time && !notificationIds.includes(row.id) && !addedRef.current.includes(row.id),
      ),
    );
    if (unreads.length) {
      addedRef.current = unreads.map((row) => row.id);
      setNotifications((notifications) => [...unreads, ...notifications]);
    }
  }, [data]);

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
