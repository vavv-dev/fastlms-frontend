import {
  MessageGetMessagesData as GetMessagesData,
  UserMessageResponse,
  messageGetMessages as getMessages,
  messageReadMessage as readMessage,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar, updateInfiniteCache } from '@/component/common';
import { calculateReverseIndex, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import { Check, Notifications, NotificationsOutlined, SmartToyOutlined } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsState } from '../layout';
import { useNavigate } from 'react-router-dom';

const READ_THRESHOLD = 3 * 1000;
const SYNC_THRESHOLD = 3 * 1000;
const readItems: Record<string, string> = {};

/**
 * Reducing the number of API calls is important for performance.
 */

export const Notification = () => {
  const { t } = useTranslation('u');
  const user = useAtomValue(userState);
  const readItemsRef = useRef(readItems);

  const syncReadMessages = useCallback(() => {
    const items = Object.keys(readItemsRef.current);
    if (items.length > 0) {
      readMessage({ requestBody: items }).then(() => {
        // update list cache
        items.forEach((id) =>
          updateInfiniteCache<UserMessageResponse>(getMessages, { id, read_time: readItemsRef.current[id] }, 'update'),
        );
        readItemsRef.current = {};
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(syncReadMessages, SYNC_THRESHOLD);
    return () => {
      clearInterval(interval);
      syncReadMessages();
    };
  }, [syncReadMessages]);

  return (
    <GridInfiniteScrollPage<UserMessageResponse, GetMessagesData>
      pageKey="message"
      orderingOptions={[{ value: 'time', label: t('Recently received') }]}
      apiService={getMessages}
      apiOptions={{ receiverId: user?.id }}
      renderItem={({ data }) => (
        <TableContainer>
          <Table sx={{ '& th,td:not(:nth-of-type(2))': { whiteSpace: 'nowrap' }, '& td': { height: '3.5em' } }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">no</TableCell>
                <TableCell>{t('Title')}</TableCell>
                <TableCell>{t('Received at')}</TableCell>
                <TableCell>{t('Read at')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((pagination, pageIndex) =>
                pagination.items?.map((row, rowIndex) => (
                  <NotificationRow
                    key={row.id}
                    row={row}
                    index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)}
                  />
                )),
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      emptyMessage={<EmptyMessage Icon={NotificationsOutlined} message={t('No message found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr' }}
      boxPadding={0}
    />
  );
};

interface NotificationRowProps {
  row: UserMessageResponse;
  index: number;
}

const NotificationRow = ({ row, index }: NotificationRowProps) => {
  const { t } = useTranslation('u');
  const navigate = useNavigate();
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [isRead, setIsRead] = useState(false);
  const timerRef = useRef<number>();
  const observerRef = useRef<IntersectionObserver>();
  const isIntersectingRef = useRef<boolean>(false);
  const readItemsRef = useRef(readItems);
  const setNotifications = useSetAtom(notificationsState);

  useEffect(() => {
    if (!row.read_time) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isIntersectingRef.current = entry.isIntersecting;

            if (entry.isIntersecting && entry.intersectionRatio === 1) {
              timerRef.current = setTimeout(() => {
                if (isIntersectingRef.current) {
                  setIsRead(true);
                  readItemsRef.current[row.id] = new Date().toISOString();
                  // update notification alter
                  setNotifications((notifications) => notifications.filter((notification) => notification.id !== row.id));
                }
              }, READ_THRESHOLD);
            } else {
              if (timerRef.current) {
                clearTimeout(timerRef.current);
              }
            }
          });
        },
        { threshold: 1.0 },
      );

      if (rowRef.current) {
        observerRef.current.observe(rowRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [row.id, row.read_time]);

  const onClick = () => {
    switch (row.kind) {
      case 'video':
      case 'short':
      case 'playlist':
      case 'course':
        navigate(`/${row.kind}/${row.object_id}`);
        break;
      case 'quiz':
      case 'survey':
      case 'asset':
      case 'exam':
      case 'lesson':
        navigate(location.pathname, {
          replace: true,
          state: { dialog: { kind: row.kind, id: row.object_id } },
        });
    }
  };

  return (
    <TableRow onClick={onClick} ref={rowRef} sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}>
      <TableCell align="center">{index}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          {row.sender ? (
            <WithAvatar variant="small" {...row.sender}>
              <Typography variant="subtitle2">{t(row.title)}</Typography>
            </WithAvatar>
          ) : (
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={t('System message')}>
                <SmartToyOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
              </Tooltip>
              {t(row.title)}
            </Typography>
          )}
          <Typography variant="body2">{t(row.object_title)}</Typography>
          {row.detail && <Typography variant="body2">{t(row.detail)}</Typography>}
        </Box>
      </TableCell>
      <TableCell>{t(...formatRelativeTime(row.time))}</TableCell>
      <ReadCell readTime={row.read_time} isRead={isRead} />
    </TableRow>
  );
};

interface ReadCellProps {
  readTime: string | null | undefined;
  isRead: boolean;
}

const ReadCell = ({ readTime, isRead }: ReadCellProps) => {
  const { t } = useTranslation('u');
  const [, forceUpdate] = useState({});

  return (
    <TableCell onMouseEnter={() => readTime && forceUpdate({})}>
      {readTime ? (
        t(...formatRelativeTime(readTime))
      ) : isRead ? (
        <Check fontSize="small" color="success" />
      ) : (
        <Notifications fontSize="small" color="error" />
      )}
    </TableCell>
  );
};
