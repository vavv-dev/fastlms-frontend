import { Alert, Collapse } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { alertState } from '.';

export const GlobalAlert = () => {
  const [alert, setAlert] = useAtom(alertState);

  useEffect(() => {
    if (alert.open) {
      // auto close alert
      const timer = setTimeout(() => {
        setAlert({ ...alert, open: false });
      }, alert.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, setAlert]);

  return (
    <Collapse in={alert.open} sx={{ flexShrink: 0 }}>
      <Alert
        variant="filled"
        severity={alert.severity}
        sx={{ borderRadius: 0 }}
        onClose={alert.hideClose ? undefined : () => setAlert({ ...alert, open: false })}
      >
        {alert.message}
      </Alert>
    </Collapse>
  );
};
