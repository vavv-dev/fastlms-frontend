import { UserMessageResponse, messageGetMessages as getMessages, messageReadMessage as readMessage } from '@/api';
import { updateInfiniteCache } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { userMessageState, userState } from '@/store';
import { Check, FiberSmartRecord, NotificationsOutlined, TagFacesOutlined } from '@mui/icons-material';
import { Badge, Box, Button, Divider, IconButton, Popover, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationsState } from '.';

/**
 * Do not call mark api on every click!
 */

const readItems: Record<string, string> = {};

export const NotificationButton = () => {
  const user = useAtomValue(userState);
  const [notifications, setNotifications] = useAtom(notificationsState);
  const userMessage = useAtomValue(userMessageState);
  const newNotificationCount = notifications.filter((notification) => !notification.read_time).length;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (userMessage) {
      const handleMessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        const messages = Array.isArray(data) ? data : [data];
        const newMessages = messages.filter((message) => !notifications.find((notification) => notification.id === message.id));
        if (newMessages.length) {
          setNotifications((notifications) => [...newMessages, ...notifications]);
        }
      };

      userMessage.onmessage = handleMessage;
      return () => {
        userMessage.onmessage = null;
      };
    }
  }, [userMessage, notifications]);

  if (!user) return null;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={newNotificationCount} color="error">
          <NotificationsOutlined />
        </Badge>
      </IconButton>
      {anchorEl && <NotificationBox anchorEl={anchorEl} setAnchorEl={setAnchorEl} notifications={notifications} />}
    </>
  );
};

interface NotificationBoxProps {
  anchorEl: HTMLButtonElement | null;
  setAnchorEl: (el: HTMLButtonElement | null) => void;
  notifications: UserMessageResponse[];
}

const NotificationBox = ({ anchorEl, setAnchorEl, notifications }: NotificationBoxProps) => {
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
  }, []);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', width: '400px' }}>
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
          }}
        >
          <Typography
            component="div"
            variant="body2"
            color="primary"
            onClick={() => {
              navigate('/u/notification');
              setAnchorEl(null);
            }}
            sx={{ cursor: 'pointer', p: 1, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
          >
            {t('See previous notifications')}
          </Typography>
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
    <Box sx={{ p: 2, display: 'flex' }}>
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
          {!notification.read_time && <FiberSmartRecord fontSize="small" color="error" />}
          {t(notification.title)}
        </Typography>
        <Typography component="div" variant="caption" sx={{ ...textEllipsisCss(1), lineHeight: 1.4 }}>
          {notification.object_title}
        </Typography>
        <Typography component="div" variant="caption">
          {t(...formatRelativeTime(notification.time))}
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
              <Check fontSize="small" sx={{ stroke: theme.palette.background.paper }} />
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
