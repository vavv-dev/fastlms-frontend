import React, { lazy, Suspense } from 'react';
import { Box, Skeleton, SxProps, useTheme } from '@mui/material';

// Lazy load the full TextEditor component
const FullTextEditor = lazy(() => import('./FullTextEditor'));

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
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: minHeight + 41,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        padding: '1em',
        ...sx,
      }}
    >
      <Skeleton variant="rectangular" width="100%" height="24px" sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="100%" height="24px" sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="60%" height="24px" />
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

export default TextEditor;
