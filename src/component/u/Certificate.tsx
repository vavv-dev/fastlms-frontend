import { VerifiedOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const Certificate = () => {
  const { t } = useTranslation('u');
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          maxWidth: 'lg',
          width: '100%',
          m: 'auto',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          p: 3,
          gap: 3,
        }}
      >
        <VerifiedOutlined sx={{ fontSize: '3em', color: 'text.secondary' }} />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {t('You does not have any certificate issued yet.')}
        </Typography>
      </Box>
    </Box>
  );
};
