import { textEllipsisCss } from '@/helper/util';
import { channelState } from '@/store';
import { VideoCameraFront } from '@mui/icons-material';
import { Avatar, Box, SxProps, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Props {
  variant?: 'large' | 'medium' | 'small';
  name: React.ReactNode;
  username: string;
  use_channel: boolean;
  thumbnail?: string | null;
  hideAvatar?: boolean;
  children?: React.ReactNode;
  color?: string;
  sx?: SxProps;
}

export const WithAvatar = ({ variant, name, username, thumbnail, use_channel, hideAvatar, color, sx, children }: Props) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const navigate = useNavigate();
  const channel = useAtomValue(channelState);

  const goToHome = (e: React.MouseEvent) => {
    if (!use_channel) return;

    const channelHome = `/channel/${username}`;
    if (channelHome !== window.location.pathname) {
      e.preventDefault();
      e.stopPropagation();
      navigate(channelHome);
    }
  };

  const avatarSize = hideAvatar ? 16 : 36 + (variant === 'large' ? 4 : variant === 'small' ? -4 : 0);
  const avatarGap = variant === 'small' ? 1 : 1.2;
  const nameVariant = variant === 'large' ? 'subtitle1' : 'subtitle2';
  const pointer = use_channel ? 'pointer' : 'default';

  return (
    <Box sx={{ position: 'relative', display: 'flex', gap: avatarGap, alignItems: 'flex-start', flexGrow: 0, ...sx }}>
      {!hideAvatar && (
        <Avatar
          className="avatar"
          onClick={goToHome}
          src={thumbnail || undefined}
          sx={{ mt: children ? '3px' : 0, width: avatarSize, height: avatarSize, cursor: pointer }}
        />
      )}
      <Box
        className="avatar-children"
        sx={{
          flexGrow: 1,
          flexShrink: 0,
          display: 'grid',
          minHeight: avatarSize,
          alignItems: 'flex-end',
          '& .MuiTypography-root': textEllipsisCss(1),
        }}
      >
        {!(hideAvatar && channel) && (
          <Typography
            onClick={goToHome}
            variant={nameVariant}
            sx={{
              color: color || 'text.primary',
              width: 'fit-content',
              fontWeight: 'bold',
              lineHeight: 1.4,
              cursor: pointer,
              '&:hover': use_channel ? { color: 'primary.main' } : undefined,
              display: 'flex !important',
              alignItems: 'center',
              gap: 0.8,
            }}
          >
            {use_channel && (
              <Tooltip title={t('Channel enabled')}>
                <VideoCameraFront color="success" sx={{ fontSize: theme.typography.subtitle2.fontSize }} />
              </Tooltip>
            )}
            {name}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
};
