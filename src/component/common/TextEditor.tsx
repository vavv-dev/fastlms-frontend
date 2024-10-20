import { Box, Divider, Skeleton, Stack, SxProps } from '@mui/material';
import React, { lazy, Suspense } from 'react';

// Lazy load the full TextEditor component
const FullTextEditor = lazy(() =>
  import('./FullTextEditor').then((module) => ({
    default: module.FullTextEditor,
  })),
);

interface TextEditorProps {
  initialValue: string;
  placeholder?: string;
  borderColor?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  container?: HTMLElement | null;
  disabled?: boolean;
  minHeight?: number;
  sx?: SxProps;
}

const TextEditorSkeleton: React.FC<{ sx?: SxProps; minHeight: number }> = ({ minHeight, sx }) => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: minHeight + 41,
        border: `1px solid rgba(0, 0, 0, 0.3)`,
        borderRadius: '8px',
        ...sx,
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ py: '5px', px: '20px' }}>
        <Skeleton variant="circular" width="28px" height="28px" />
        <Skeleton variant="circular" width="28px" height="28px" />
        <Skeleton variant="circular" width="28px" height="28px" />
        <Skeleton variant="circular" width="28px" height="28px" />
        <Skeleton variant="circular" width="28px" height="28px" />
        <Skeleton variant="circular" width="28px" height="28px" />
      </Stack>
      <Divider flexItem />
      <Stack spacing={1} sx={{ px: '12px', py: '18px' }}>
        <Skeleton variant="rectangular" width="100%" height="24px" />
        <Skeleton variant="rectangular" width="60%" height="24px" />
      </Stack>
    </Box>
  );
};

export const TextEditor: React.FC<TextEditorProps> = (props) => {
  return (
    <Suspense fallback={<TextEditorSkeleton minHeight={props.minHeight || 80} sx={props.sx} />}>
      <FullTextEditor {...props} />
    </Suspense>
  );
};
