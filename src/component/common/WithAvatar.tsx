import { textEllipsisCss } from '@/helper/util';
import { homeUserState } from '@/store';
import { Avatar, Box, SxProps, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';

interface Props {
  variant?: 'large' | 'medium' | 'small';
  name: React.ReactNode;
  username: string;
  thumbnail?: string | null;
  hideAvatar?: boolean;
  children?: React.ReactNode;
  color?: string;
  sx?: SxProps;
}

export const WithAvatar = ({ variant, name, username, thumbnail, hideAvatar, color, sx, children }: Props) => {
  const navigate = useNavigate();
  const userHome = `/u/${username}`;
  const homeUser = useAtomValue(homeUserState);

  const goToHome = (e: React.MouseEvent) => {
    if (userHome !== window.location.pathname) {
      e.preventDefault();
      e.stopPropagation();
      navigate(userHome);
    }
  };

  const avatarSize = hideAvatar ? 16 : 36 + (variant === 'large' ? 4 : variant === 'small' ? -4 : 0);
  const avatarGap = variant === 'small' ? 1 : 1.2;
  const nameVariant = variant === 'large' ? 'subtitle1' : 'subtitle2';

  return (
    <Box sx={{ position: 'relative', display: 'flex', gap: avatarGap, alignItems: 'flex-start', flexGrow: 1, ...sx }}>
      {!hideAvatar && (
        <Avatar
          className="avatar"
          onClick={goToHome}
          src={thumbnail || undefined}
          sx={{ mt: children ? '3px' : 0, width: avatarSize, height: avatarSize, '& img': { cursor: 'pointer' } }}
        />
      )}
      <Box
        className="avatar-children"
        sx={{
          flexGrow: 1,
          display: 'grid',
          minHeight: avatarSize,
          alignItems: 'center',
          '& .MuiTypography-root': textEllipsisCss(1),
        }}
      >
        {!(hideAvatar && homeUser) && (
          <Typography
            onClick={goToHome}
            variant={nameVariant}
            sx={{
              color: color || 'text.primary',
              width: 'fit-content',
              fontWeight: 'bold',
              lineHeight: 1.4,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {name}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
};
