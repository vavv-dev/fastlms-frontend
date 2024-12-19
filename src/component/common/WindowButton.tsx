import { Button, SxProps, Tooltip, useTheme } from '@mui/material';

interface WindowButtonProps {
  title: string;
  onClick: () => void;
  color: { light: string; main: string };
  children?: React.ReactNode;
  disabled?: boolean;
  sx?: SxProps;
}

export const WindowButton = ({ title, onClick, color, children, disabled, sx }: WindowButtonProps) => {
  const theme = useTheme();

  return (
    <Tooltip title={title}>
      <span style={{ display: 'inline-block' }}>
        <Button
          disabled={disabled}
          onClick={onClick}
          sx={{
            display: 'flex',
            width: 10,
            minWidth: 10,
            aspectRatio: 1,
            borderRadius: '50%',
            ...(disabled ? { bgcolor: 'action.disabled' } : { bgcolor: color.light, '&:hover': { bgcolor: color.main } }),
            minHeight: 0,
            color: theme.palette.common.white,
            ...sx,
          }}
        >
          {children}
        </Button>
      </span>
    </Tooltip>
  );
};
