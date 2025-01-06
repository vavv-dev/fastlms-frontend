import { Typography, Box } from '@mui/material';

export const Unauthorized = () => {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
      <Typography variant="h2">401 Unauthorized</Typography>
    </Box>
  );
};
