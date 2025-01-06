import { Alert, AlertTitle, Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CenteredBox = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  zIndex: 9999,
}));

interface StrictTabControlProps {
  children: React.ReactNode;
  allowedPatterns?: RegExp[];
}

export const StrictTabControl = ({ children, allowedPatterns = [] }: StrictTabControlProps) => {
  const { t } = useTranslation('layout');
  const [isBlocked, setIsBlocked] = useState(false);

  const isUrlExcepted = (pathname: string) => {
    const patterns = [...allowedPatterns];
    return patterns.some((pattern) => pattern.test(pathname));
  };

  useEffect(() => {
    if (isUrlExcepted(location.pathname)) {
      setIsBlocked(false);
      return;
    }

    const channel = new BroadcastChannel('strict_tab_control');
    const tabId = Date.now().toString();
    const LOCK_TIMEOUT = 1000;
    let hasLock = false;

    const getTabId = () => {
      let storedTabId = sessionStorage.getItem('tabId');
      if (!storedTabId) {
        storedTabId = tabId;
        sessionStorage.setItem('tabId', storedTabId);
      }
      return storedTabId;
    };

    const currentTabId = getTabId();

    const isLockValid = (timestamp: string) => {
      const now = Date.now();
      return now - parseInt(timestamp) <= LOCK_TIMEOUT;
    };

    const checkExistingTab = () => {
      const existingLock = localStorage.getItem('tabLock');
      const existingTimestamp = localStorage.getItem('tabTimestamp');

      if (existingLock && existingTimestamp && isLockValid(existingTimestamp)) {
        if (existingLock === currentTabId) {
          return { exists: true, isOwner: true };
        }
        return { exists: true, isOwner: false };
      }
      return { exists: false, isOwner: false };
    };

    const tryAcquireLock = () => {
      const existing = checkExistingTab();

      if (existing.isOwner) {
        hasLock = true;
        return true;
      }

      if (existing.exists) {
        return false;
      }

      localStorage.setItem('tabLock', currentTabId);
      localStorage.setItem('tabTimestamp', Date.now().toString());
      hasLock = true;
      return true;
    };

    const maintainLock = () => {
      if (hasLock) {
        localStorage.setItem('tabTimestamp', Date.now().toString());
        return true;
      }
      return false;
    };

    const handleTabCheck = () => {
      const existing = checkExistingTab();

      if (existing.exists && !existing.isOwner) {
        setIsBlocked(true);
        return false;
      }

      return hasLock;
    };

    const initialCheck = () => {
      const canAcquire = tryAcquireLock();

      if (canAcquire) {
        channel.postMessage({ type: 'TAB_ACTIVE', tabId: currentTabId });
        setIsBlocked(false);
      } else {
        handleTabCheck();
      }
    };

    const lockInterval = setInterval(() => {
      if (!isBlocked) {
        maintainLock();
      }
    }, LOCK_TIMEOUT / 4);

    channel.onmessage = (event) => {
      if (event.data.type === 'TAB_ACTIVE' && event.data.tabId !== currentTabId) {
        handleTabCheck();
      }
    };

    initialCheck();

    const cleanup = () => {
      if (hasLock && localStorage.getItem('tabLock') === currentTabId) {
        localStorage.removeItem('tabLock');
        localStorage.removeItem('tabTimestamp');
      }
      channel.close();
      clearInterval(lockInterval);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanup();
      } else if (document.visibilityState === 'visible') {
        initialCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [location.pathname]); // eslint-disable-line

  if (isBlocked && !isUrlExcepted(location.pathname)) {
    return (
      <CenteredBox>
        <Container maxWidth="sm">
          <Alert
            severity="warning"
            sx={{
              p: 3,
              '& .MuiAlert-message': { width: '100%' },
              borderRadius: 1,
            }}
          >
            <AlertTitle>{t('Another tab is already running.')}</AlertTitle>
            <Typography variant="body2">{t('You can only have one tab open at a time.')}</Typography>
          </Alert>
        </Container>
      </CenteredBox>
    );
  }

  return children;
};
