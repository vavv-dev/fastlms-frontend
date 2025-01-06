import { CopyAllOutlined, DeleteOutlined, InsertLinkOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Checkbox,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  MessageResponse as Response,
  assistantDeleteMessage as deleteMessage,
  assistantGetMessages as getMessages,
} from '@/api';
import { updateInfiniteCache } from '@/component/common';
import { formatDatetimeLocale, formatRelativeTime } from '@/helper/util';
import { userState } from '@/store';

interface MessageBubbleProps {
  message: Response;
  context: Set<string>;
  setContext: (newContext: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  waiting?: boolean;
}

export const MessageBubble = memo(({ message, context, setContext, waiting }: MessageBubbleProps) => {
  const { t } = useTranslation('chat');
  const theme = useTheme();
  const isUser = message.role === 'user';
  const user = useAtomValue(userState);
  const navigate = useNavigate();
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(message.created));
  const [isHovered, setIsHovered] = useState(false);
  const [deleteAnchorEl, setDeleteAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isHovered) return;

    const interval = setInterval(() => {
      const newTime = formatRelativeTime(message.created);
      setRelativeTime((prev) => {
        if (prev[0] !== newTime[0] || prev[1] !== newTime[1]) {
          return newTime;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHovered, message.created]);

  const handleContextChange = useCallback(
    (messageId: string) => {
      setContext((prev) => {
        const newContext = new Set(prev);
        if (newContext.has(messageId)) {
          newContext.delete(messageId);
        } else {
          newContext.add(messageId);
        }
        return newContext;
      });
    },
    [setContext],
  );

  const showDelete = (e: React.MouseEvent<HTMLElement>) => {
    setDeleteAnchorEl(deleteAnchorEl ? null : e.currentTarget);
  };

  const deleteMessages = () => {
    deleteMessage({ id: message.id }).then(() => {
      setContext(new Set());
      updateInfiniteCache<Response>(getMessages, message, 'delete');
    });
  };

  const messageLocation = useMemo(() => {
    if (!message.location) return null;
    const lo = new URL(message.location);
    return lo.href.replace(lo.origin, '');
  }, [message.location]);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 1 }}
    >
      {!isUser && (
        <Avatar sx={{ mt: 1, width: 36, height: 36, bgcolor: theme.palette.primary.main }} alt="AI">
          {t('AI')}
        </Avatar>
      )}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          maxWidth: '75%',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
        <Typography
          variant="caption"
          sx={{
            '& .MuiSvgIcon-root': { font: theme.typography.body1 },
            '& .MuiButtonBase-root': { p: 0.4 },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
          }}
        >
          <Tooltip title={t('Add to new message context')}>
            <Checkbox
              size="small"
              disableRipple
              sx={{ p: 0, color: theme.palette.text.disabled }}
              checked={context.has(message.id)}
              onChange={() => handleContextChange(message.id)}
            />
          </Tooltip>
          <Tooltip title={formatDatetimeLocale(message.created)}>
            <span>{t(...relativeTime)}</span>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          {messageLocation && message.location != window.location.href && (
            <Tooltip title={t('Go to message written location')} color="primary">
              <IconButton onClick={() => navigate(messageLocation)}>
                <InsertLinkOutlined />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('Copy')}>
            <IconButton onClick={() => navigator.clipboard.writeText(message.content)}>
              <CopyAllOutlined />
            </IconButton>
          </Tooltip>
          <IconButton onClick={showDelete}>
            <DeleteOutlined />
          </IconButton>
          <Menu
            anchorEl={deleteAnchorEl}
            open={Boolean(deleteAnchorEl)}
            onClose={() => setDeleteAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ zIndex: theme.zIndex.drawer + 103 }}
          >
            <MenuItem onClick={deleteMessages}>
              <Typography variant="body2" color="error">
                {t('Delete message')}
              </Typography>
            </MenuItem>
          </Menu>
        </Typography>
        {waiting && <LinearProgress color="secondary" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />}
      </Paper>
      {isUser && (
        <Avatar sx={{ mt: 1, width: 36, height: 36 }} src={user?.thumbnail}>
          {user?.name[0]}
        </Avatar>
      )}
    </Box>
  );
});
