import { Box, Button, Collapse, Snackbar, Toolbar as Spacer } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { alertState, snackbarMessageState, spacerRefState } from '.';
import { NavDrawer } from './NavDrawer';
import { TopBar } from './TopBar';

import { ChatDrawer, chatDrawerState } from '@/component/chat';

export const BaseLayout = ({ searchBar, hideDrawer = false }: { searchBar?: React.ReactNode; hideDrawer?: boolean }) => {
  const { t } = useTranslation('layout');
  const [snackbarMessage, setSnackbarMessage] = useAtom(snackbarMessageState);
  const alert = useAtomValue(alertState);
  const setSpacerRef = useSetAtom(spacerRefState);
  const [chatDrawerOpen, setChatDrawerOpen] = useAtom(chatDrawerState);

  return (
    <Box sx={{ width: '100%' }}>
      {chatDrawerOpen && <ChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />}
      <TopBar searchBar={searchBar} />
      <Spacer ref={(ref) => setSpacerRef(ref)} />
      <Collapse in={alert.open}>
        <Box sx={{ height: 48 }} />
      </Collapse>
      <Box sx={{ display: 'flex' }}>
        <NavDrawer hideDrawer={hideDrawer} />
        <Box sx={{ minWidth: 0, width: '100%', display: 'flex', flexGrow: 1, flexDirection: 'column', position: 'relative' }}>
          <Outlet />
        </Box>
      </Box>
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={snackbarMessage?.duration || 5000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage?.message}
        action={
          <>
            {snackbarMessage?.action}
            <Button onClick={() => setSnackbarMessage(null)} sx={{ color: 'primary.light' }}>
              {t('Close')}
            </Button>
          </>
        }
      />
    </Box>
  );
};
