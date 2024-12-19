import { SvgIconComponent } from '@mui/icons-material';
import { Box, SxProps, Typography } from '@mui/material';

interface Props {
  Icon: SvgIconComponent;
  message: React.ReactNode;
  sx?: SxProps;
}

export const EmptyMessage = ({ Icon, message, sx }: Props) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        px: 3,
        py: 5,
        gap: 2,
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: '3em', color: 'text.secondary' }} />
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        {message}
      </Typography>
    </Box>
  );
};
