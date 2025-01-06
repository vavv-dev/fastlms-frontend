import { Alert, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { useEffect } from 'react';

export const Message = ({ message, onClose }: { message: string | null; onClose: () => void }) => {
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Box
      sx={{
        '@keyframes shake': {
          '0%, 100%': { transform: 'translateX(-50%)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-52%)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(-48%)' },
        },
        position: 'absolute',
        top: 40,
        left: '50%',
        transform: `translateX(-50%) translateY(${message ? 0 : -20}px)`,
        maxHeight: message ? 100 : 0,
        opacity: message ? 1 : 0,
        pointerEvents: message ? 'all' : 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        zIndex: theme.zIndex.modal + 2,
        boxShadow: 10,
        animation: message ? 'shake 0.5s ease-in-out' : 'none',
      }}
    >
      <Alert
        severity="warning"
        onClose={onClose}
        sx={{ minWidth: 250, transition: 'all 0.2s ease', opacity: message ? 1 : 0, transform: `scale(${message ? 1 : 0.95})` }}
      >
        {message}
      </Alert>
    </Box>
  );
};
