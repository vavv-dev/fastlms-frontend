import { FiberSmartRecord, NotificationsOutlined, SmartToy } from '@mui/icons-material';
import { Avatar, Box, IconButton, Table, TableBody, TableCell, TableContainer, TableRow, Tooltip } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { notificationsState } from '.';

import {
  MessageGetMessagesData as GetMessagesData,
  UserMessageResponse as MessageResponse,
  messageGetMessages as getMessages,
  messageReadMessage as readMessage,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar, updateInfiniteCache } from '@/component/common';
import { ViewDialog } from '@/component/share/ViewDialog';
import { calculateReverseIndex, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';

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
          updateInfiniteCache<MessageResponse>(getMessages, { id, read_time: readItemsRef.current[id] }, 'update'),
        );
        readItemsRef.current = {};
      });
    }
  }, []);

  // prevent calling syncReadMessages on every messages
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
    <GridInfiniteScrollPage<MessageResponse, GetMessagesData>
      pageKey="message"
      orderingOptions={[{ value: 'time', label: t('Recently received') }]}
      apiService={getMessages}
      apiOptions={{ receiverId: user?.id }}
      renderItem={({ data }) => {
        const seenIds = new Set<string>();
        const processedData = data?.map((pagination) => ({
          ...pagination,
          items: pagination.items?.filter((item) => {
            const isDuplicate = seenIds.has(item.id);
            seenIds.add(item.id);
            return !isDuplicate;
          }),
        }));

        return (
          <TableContainer>
            <Table sx={{ '& th,td:not(:nth-of-type(2))': { whiteSpace: 'nowrap' }, '& td': { height: '3.5em' } }}>
              <TableBody>
                {processedData?.map((pagination, pageIndex) =>
                  pagination.items?.map((row, rowIndex) => (
                    <NotificationRow
                      key={row.id}
                      row={row}
                      index={calculateReverseIndex(processedData, pageIndex, rowIndex, pagination.total)}
                    />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }}
      emptyMessage={<EmptyMessage Icon={NotificationsOutlined} message={t('No message found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr' }}
      boxPadding={0}
    />
  );
};

interface NotificationRowProps {
  row: MessageResponse;
  index: number;
}

const NotificationRow = ({ row, index }: NotificationRowProps) => {
  const { t } = useTranslation('notification');
  const navigate = useNavigate();
  const setNotifications = useSetAtom(notificationsState);
  const readItemsRef = useRef(readItems);
  const [localRead, setLocalRead] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);

  const markAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasRead && !row.read_time) {
      readItemsRef.current[row.id] = new Date().toISOString();
      setLocalRead(true);
      setNotifications((notifications) => notifications.filter((n) => n.id !== row.id));
    }
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(e);

    switch (row.kind) {
      case 'asset':
      case 'quiz':
      case 'survey':
      case 'exam':
        if (row.parcel && row.parcel.course_id && row.parcel.lesson_id) {
          navigate(`/course/${row.parcel.course_id}/player`, {
            state: {
              resourceLocation: {
                lesson_id: row.parcel.lesson_id,
                resource_id: row.object_id,
              },
            },
          });
          break;
        }
        setViewDialog(true);
        break;
      case 'lesson':
        setViewDialog(true);
        break;
      default:
        navigate(`/${row.kind}/${row.object_id}`);
    }
  };

  const hasRead = localRead || !!readItemsRef.current[row.id];

  return (
    <TableRow onClick={onClick} sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}>
      <TableCell align="center">{index}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: hasRead || row.read_time ? 400 : 700 }}>
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
          <Box dangerouslySetInnerHTML={{ __html: row.object_title }} />
        </Box>
      </TableCell>
      <TableCell>{t(...formatRelativeTime(row.time))}</TableCell>

      <TableCell align="center">
        {row.read_time ? (
          t(...formatRelativeTime(row.read_time))
        ) : (
          <Tooltip title={t('Mark as read')}>
            <span>
              <IconButton onClick={markAsRead} disabled={hasRead}>
                <FiberSmartRecord sx={{ color: hasRead ? 'action.disabled' : 'error.main' }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <ViewDialog
          id={row.object_id}
          kind={row.kind as 'asset' | 'quiz' | 'survey' | 'exam' | 'lesson'}
          open={viewDialog}
          onClose={() => setViewDialog(false)}
        />
      </TableCell>
    </TableRow>
  );
};
