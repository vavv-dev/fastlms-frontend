import { Box } from '@mui/material';

import { CommentDisplays } from '.';

export const UserComment = () => {
  return (
    <Box sx={{ '> .MuiBox-root': { p: 0 } }}>
      <CommentDisplays mode="commenter" />
    </Box>
  );
};
