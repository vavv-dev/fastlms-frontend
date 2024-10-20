import { CommentDisplays } from '@/component/comment';
import { Box } from '@mui/material';

export const Comment = () => {
  return (
    <Box sx={{ '> .MuiBox-root': { p: 0 } }}>
      <CommentDisplays mode="commenter" />
    </Box>
  );
};
