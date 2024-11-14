import ContactMailOutlined from '@mui/icons-material/ContactMailOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { Avatar, Box, Button, IconButton, ListItemButton, ListItemText, Menu, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { accountProcessingState } from '.';

import { GradientCircularProgress } from '@/component/common';
import { userState } from '@/store';

export const LoginButton = () => {
  const { t } = useTranslation('account');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const processing = useAtomValue(accountProcessingState);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const dropdowItems: [string, string, React.ElementType][] = [
    [t('Profile'), `/u/profile`, ContactMailOutlined],
    [t('Logout'), '/logout', LogoutOutlined],
  ];

  if (processing) {
    return (
      <Box sx={{ position: 'relative', width: 42, textAlign: 'center' }}>
        <GradientCircularProgress size={28} />
      </Box>
    );
  }

  return (
    <>
      {!user ? (
        <Button component={Link} to="login">
          {t('Login')}
        </Button>
      ) : (
        <>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar src={user.thumbnail || ''} sx={{ width: 32, height: 32 }}>
              {user?.name ? user.name[0] : 'M'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={() => setAnchorEl(null)}
            onClick={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{ '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
          >
            {dropdowItems.map(([title, to, Icon]) => (
              <ListItemButton key={title} component={Link} to={to}>
                {Icon && <Icon sx={{ minWidth: 0, mr: 3, justifyContent: 'center' }} />}
                <ListItemText primary={title} />
              </ListItemButton>
            ))}
          </Menu>
        </>
      )}
    </>
  );
};
