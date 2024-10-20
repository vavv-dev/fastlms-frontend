import { UserMessageResponse } from '@/api';
import { formatDatetimeLocale } from '@/helper/util';
import { userMessageState } from '@/store';
import { NotificationsOutlined, TagFacesOutlined } from '@mui/icons-material';
import { Badge, Box, Divider, IconButton, Popover, Stack, Typography, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationState } from '.';

const newNotificationCountState = atom<number>(0);

export const NotificationButton = () => {
  const { t } = useTranslation('layout');
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useAtom(notificationState);
  const [newNotificationCount, setNewNotificationCount] = useAtom(newNotificationCountState);
  const userMessage = useAtomValue(userMessageState);

  if (userMessage) {
    userMessage.onmessage = (event) => {
      // check if message is array
      const data = JSON.parse(event.data);
      const messages = Array.isArray(data) ? data : [data];
      setNotifications((notifications) => [...messages, ...notifications]);
      setNewNotificationCount((count) => count + messages.length);
    };
  }

  useEffect(() => {
    if (!anchorEl) return;
    setTimeout(() => setNewNotificationCount(0), 3000);
  }, [anchorEl]); // eslint-disable-line

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={newNotificationCount} color="error">
          <NotificationsOutlined />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius } }}
      >
        <Stack sx={{ maxHeight: '500px', width: '400px' }} divider={<Divider />} direction="column">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationItem
                key={index}
                notification={notification}
                isNew={newNotificationCount > 0 && index < newNotificationCount}
              />
            ))
          ) : (
            <Typography
              component="div"
              variant="subtitle2"
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
            >
              <TagFacesOutlined />
              {t('No nofitication.')}
            </Typography>
          )}

          <Typography
            component="div"
            variant="body2"
            color="primary"
            onClick={() => {
              navigate('/u/notification');
              setAnchorEl(null);
            }}
            sx={{ cursor: 'pointer', p: 1.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}
          >
            {t('See previous notifications')}
          </Typography>
        </Stack>
      </Popover>
    </>
  );
};

const NotificationItem = ({ notification, isNew }: { notification: UserMessageResponse; isNew: boolean }) => {
  const { t } = useTranslation('layout');
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        gap: 0.5,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isNew ? theme.palette.action.hover : 'transparent',
      }}
    >
      <Typography component="div" variant="subtitle2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
        {t(notification.title)}
      </Typography>
      <Typography component="div" variant="caption" sx={{ lineHeight: 1.4 }}>
        {notification.object_title}
      </Typography>
      <Typography component="div" variant="caption">
        {formatDatetimeLocale(notification.time)}
      </Typography>
    </Box>
  );
};
