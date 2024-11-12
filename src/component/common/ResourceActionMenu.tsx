import { MoreVert } from '@mui/icons-material';
import { IconButton, Menu, MenuList, useTheme } from '@mui/material';
import { useState } from 'react';

interface Props {
  menuItems: React.ReactNode;
  icon?: React.ReactNode;
}

export const ResourceActionMenu = ({ menuItems, icon }: Props) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={openMenu}>{icon || <MoreVert />}</IconButton>
      <Menu
        open={!!anchorEl}
        onClick={onClick}
        anchorEl={anchorEl}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{ '& .MuiMenu-list': { p: 0 }, '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
      >
        <MenuList dense>{menuItems}</MenuList>
      </Menu>
    </>
  );
};
