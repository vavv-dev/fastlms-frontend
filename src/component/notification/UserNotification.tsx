import {
  MessageGetMessagesData as GetMessagesData,
  UserMessageResponse,
  messageGetMessages as getMessages,
  messageReadMessage as readMessage,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar, updateInfiniteCache } from '@/component/common';
import { calculateReverseIndex, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';
import { Check, FiberSmartRecord, NotificationsOutlined, SmartToy } from '@mui/icons-material';
import {
  Avatar,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationsState } from '.';

/**
 * Do not call mark api on every click!
 */

const PERSIST_EVENT = ['beforeunload', 'pagehide', 'visibilitychange'];
const readItems: Record<string, string> = {};

export const UserNotification = () => {
  const { t } = useTranslation('notification');
  const user = useAtomValue(userState);
  const readItemsRef = useRef(readItems);

  const syncReadMessages = useCallback(() => {
    const items = Object.keys(readItemsRef.current);
    if (items.length > 0) {
      readMessage({ requestBody: items }).then(() => {
        items.forEach((id) =>
          updateInfiniteCache<UserMessageResponse>(getMessages, { id, read_time: readItemsRef.current[id] }, 'update'),
        );
        readItemsRef.current = {};
      });
    }
  }, []);

  useEffect(() => {
    const eventWrapper = (e: Event) => {
      if (e.type === 'visibilitychange' && !(document.visibilityState === 'hidden')) {
        return;
      }
      syncReadMessages();
    };

    PERSIST_EVENT.forEach((event) => {
      window.removeEventListener(event, eventWrapper);
      window.addEventListener(event, eventWrapper);
    });

    return () => {
      syncReadMessages();
      PERSIST_EVENT.forEach((event) => {
        window.removeEventListener(event, eventWrapper);
      });
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
                <TableCell>{t('Message')}</TableCell>
                <TableCell>{t('Received at')}</TableCell>
                <TableCell align="center">{t('Read at')}</TableCell>
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
  const { t } = useTranslation('notification');
  const theme = useTheme();
  const navigate = useNavigate();
  // '_' required to rerender component
  const [_, setNotifications] = useAtom(notificationsState);
  const readItemsRef = useRef(readItems);

  const markAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    readItemsRef.current[row.id] = new Date().toISOString();
    // update topbar
    setNotifications((notifications) => notifications.filter((n) => n.id !== row.id));
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(e);

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

  const hasRead = !!readItemsRef.current[row.id];

  return (
    <TableRow onClick={onClick} sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}>
      <TableCell align="center">{index}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: hasRead || row.read_time ? 400 : 600 }}>
            {!hasRead && !row.read_time && <FiberSmartRecord fontSize="small" color="error" />}
            {row.sender ? (
              <WithAvatar variant="small" {...row.sender}>
                {t(row.title)}
              </WithAvatar>
            ) : (
              <>
                <Tooltip title={t('System message')}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <SmartToy fontSize="small" />
                  </Avatar>
                </Tooltip>
                {t(row.title)}
              </>
            )}
          </Box>
          <Typography variant="body2">{t(row.object_title)}</Typography>
          {row.detail && <Typography variant="body2">{t(row.detail)}</Typography>}
        </Box>
      </TableCell>
      <TableCell>{t(...formatRelativeTime(row.time))}</TableCell>

      <TableCell align="center">
        {row.read_time ? (
          t(...formatRelativeTime(row.read_time))
        ) : (
          <Tooltip title={t('Mark as read')}>
            <IconButton onClick={markAsRead} disabled={!!hasRead}>
              <Check sx={{ color: hasRead ? theme.palette.action.disabled : 'inherit' }} />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};
