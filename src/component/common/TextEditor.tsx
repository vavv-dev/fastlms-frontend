import { Box, Divider, Skeleton, Stack, SxProps } from '@mui/material';
import { Suspense, lazy } from 'react';

// Lazy load the full TextEditor component
const FullTextEditor = lazy(() =>
  import('./FullTextEditor').then((module) => ({
    default: module.FullTextEditor,
  })),
);

// const FullTextEditor = lazy(
//   () =>
//     new Promise((resolve) => {
//       setTimeout(() => {
//         import('./FullTextEditor').then((module) => {
//           resolve({ default: module.FullTextEditor });
//         });
//       }, 3000);
//     }),
// );

const TextEditorSkeleton = ({ minHeight, sx }: { minHeight: number; sx?: SxProps }) => {
  return (
    <Box sx={{ width: '100%', border: `1px solid rgba(0, 0, 0, 0.3)`, borderRadius: 3, ...sx }}>
      <Stack direction="row" spacing={0.5} sx={{ py: '5px', px: '20px' }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="circular" width="28px" height="28px" />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: '12px !important' }} />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="circular" width="28px" height="28px" />
        ))}
      </Stack>
      <Divider flexItem />
      <Stack spacing={1} sx={{ px: '12px', py: '18px', minHeight }}>
        <Skeleton variant="rectangular" width="65%" height="24px" />
      </Stack>
    </Box>
  );
};

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

export const TextEditor = (props: TextEditorProps) => {
  return (
    <Suspense fallback={<TextEditorSkeleton minHeight={props.minHeight || 80} sx={props.sx} />}>
      <FullTextEditor {...props} />
    </Suspense>
  );
};
