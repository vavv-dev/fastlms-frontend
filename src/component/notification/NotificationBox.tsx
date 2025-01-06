import { FiberSmartRecord, NotificationsOutlined, TagFacesOutlined } from '@mui/icons-material';
import { Badge, Box, Button, Divider, IconButton, Link, Popover, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr/_internal';

import { notificationsState } from '.';

import {
  CertificateResponse,
  CourseDisplayResponse,
  UserMessageResponse,
  courseGetDisplays,
  courseGetView,
  messageGetMessages as getMessages,
  messageReadMessage as readMessage,
} from '@/api';
import { useForceLogout } from '@/component/account';
import { updateInfiniteCache } from '@/component/common';
import { formatRelativeTime, stripHtml, textEllipsisCss } from '@/helper/util';
import { userMessageState, userState } from '@/store';

/**
 * Do not call mark api on every click!
 */

const readItems: Record<string, string> = {};

export const NotificationBox = () => {
  const user = useAtomValue(userState);
  const [notifications, setNotifications] = useAtom(notificationsState);
  const userMessage = useAtomValue(userMessageState);
  const newNotificationCount = notifications.filter((notification) => !notification.read_time).length;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const forceLogout = useForceLogout();
  const { cache: globalCache, mutate } = useSWRConfig();

  useEffect(() => {
    if (userMessage) {
      const handleMessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        const messages = (Array.isArray(data) ? data : [data]) as UserMessageResponse[];
        const newMessages = messages.filter((message) => !notifications.find((notification) => notification.id === message.id));

        if (newMessages.length) {
          setNotifications((notifications) => [...newMessages, ...notifications]);
          newMessages.forEach((message) => {
            // temporary parcel: force logout
            const logout = message.parcel?.force_logout;
            if (logout) {
              forceLogout();
            }

            // temporary parcel: newly issuded certificates
            const certificates = (message.parcel?.certificates || []) as CertificateResponse[];
            if (certificates.length) {
              const courseId = message.object_id;
              // update course list
              updateInfiniteCache<CourseDisplayResponse>(
                courseGetDisplays,
                { id: courseId, certificates: [...certificates] },
                'update',
              );

              // update course view
              const cacheKey = Array.from(globalCache.keys()).find((key) => {
                if (!key || typeof key !== 'string') return false;
                const r = new RegExp(`${courseGetView.name}/.+${courseId}`);
                return r.test(key);
              });

              if (cacheKey && globalCache.get(cacheKey)?.data) {
                mutate(cacheKey, (prev) => ({ ...prev, certificates: [...certificates] }), { revalidate: false });
              }
            }

            // update cache
            updateInfiniteCache<UserMessageResponse>(getMessages, message, 'create');
          });
        }
      };

      userMessage.onmessage = handleMessage;
      return () => {
        userMessage.onmessage = null;
      };
    }
  }, [userMessage, notifications, setNotifications, mutate, forceLogout, globalCache]);

  if (!user) return null;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={newNotificationCount > 10 ? '10+' : newNotificationCount} color="error">
          <NotificationsOutlined />
        </Badge>
      </IconButton>
      {anchorEl && <InBox anchorEl={anchorEl} setAnchorEl={setAnchorEl} notifications={notifications} />}
    </>
  );
};

interface NotificationBoxProps {
  anchorEl: HTMLButtonElement | null;
  setAnchorEl: (el: HTMLButtonElement | null) => void;
  notifications: UserMessageResponse[];
}

const InBox = ({ anchorEl, setAnchorEl, notifications }: NotificationBoxProps) => {
  const { t } = useTranslation('notification');
  const theme = useTheme();
  const navigate = useNavigate();
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
    return () => syncReadMessages();
  }, [syncReadMessages]);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', width: '400px', maxWidth: '100%' }}>
        {notifications.length > 0 && (
          <Typography
            component="div"
            variant="caption"
            sx={{
              position: 'sticky',
              top: 0,
              textAlign: 'center',
              color: 'text.secondary',
              px: 2,
              py: 0.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              zIndex: 1,
            }}
          >
            {t('New notifications')}
          </Typography>
        )}
        <Stack
          divider={<Divider />}
          direction="column"
          sx={{
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationItem key={index} notification={notification} setAnchorEl={setAnchorEl} />
            ))
          ) : (
            <Typography
              component="div"
              variant="subtitle2"
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
            >
              <TagFacesOutlined />
              {t('There is no new notification.')}
            </Typography>
          )}
        </Stack>
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            position: 'sticky',
            bottom: 0,
            width: '100%',
            bgcolor: theme.palette.background.paper,
            textAlign: 'center',
            p: 0.5,
          }}
        >
          <Link
            component="button"
            underline="hover"
            variant="body2"
            onClick={() => {
              navigate('/u/notification');
              setAnchorEl(null);
            }}
          >
            {t('See previous notifications')}
          </Link>
        </Box>
      </Box>
    </Popover>
  );
};

interface NotificationItemProps {
  notification: UserMessageResponse;
  setAnchorEl: (el: HTMLButtonElement | null) => void;
}

const NotificationItem = ({ notification, setAnchorEl }: NotificationItemProps) => {
  const { t } = useTranslation('notification');
  const theme = useTheme();
  const navigate = useNavigate();
  const setNotifications = useSetAtom(notificationsState);
  const readItemsRef = useRef(readItems);

  const markAsRead = () => {
    readItemsRef.current[notification.id] = new Date().toISOString();
    setNotifications((notifications) =>
      notifications.map((n) => (n.id === notification.id ? { ...n, read_time: new Date().toISOString() } : n)),
    );
  };

  const goToDetail = () => {
    navigate('/u/notification');
    setAnchorEl(null);
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
      <Box sx={{ gap: 0.5, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography
          component="div"
          variant="subtitle2"
          sx={{
            fontWeight: notification.read_time ? 400 : 600,
            ...textEllipsisCss(1),
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {t(notification.title)}
        </Typography>
        <Typography component="div" variant="caption">
          {t(...formatRelativeTime(notification.time))}
        </Typography>
        <Typography component="div" variant="body2" sx={{ ...textEllipsisCss(1), lineHeight: 1.4 }}>
          {stripHtml(notification.object_title)}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {!notification.read_time && (
          <Tooltip title={t('Mark as read')}>
            <IconButton size="small" onClick={markAsRead}>
              <FiberSmartRecord fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
        <Button
          onClick={goToDetail}
          size="small"
          color="inherit"
          sx={{ fontSize: theme.typography.caption.fontSize, fontWeight: 300, p: 0, minWidth: 0, textTransform: 'none' }}
        >
          {t('Detail')}
        </Button>
      </Box>
    </Box>
  );
};
