import { CircularProgress, CircularProgressProps } from '@mui/material';

export const GradientCircularProgress = ({ sx, ...props }: CircularProgressProps) => {
  return (
    <>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="gradient-circle" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress
        disableShrink
        sx={{ 'svg circle': { stroke: 'url(#gradient-circle)', strokeDasharray: '100, 300' }, ...sx }}
        {...props}
      />
    </>
  );
};
