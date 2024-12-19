import { Box, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Thread } from './Thread';

import { channelState } from '@/store';

export const QnADisplays = () => {
  const { t } = useTranslation('comment');
  const channel = useAtomValue(channelState);
  const theme = useTheme();

  if (!channel) return null;

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box
        sx={{
          maxWidth: 'md',
          mx: 'auto',
          '& .comment-thread-header': { whiteSpace: 'nowrap' },
          '& .comment-write': { my: 3 },
          '& .comment-write .MuiTiptap-FieldContainer-root': { borderTopLeftRadius: '0 !important', borderRadius: 3 },
          '& .comment-content > .MuiBox-root': { mr: 0 },
          '& .comment-view': {
            mb: 1,
            '& .comment-action-menu': { right: '0.5em', top: '2em' },
            '& .avatar-children': {
              border: `1px solid ${theme.palette.divider}`,
              p: 2.5,
              borderRadius: '16px',
              borderTopLeftRadius: 0,
            },
          },
        }}
      >
        <Thread
          url={encodeURIComponent(`${window.location.origin}/channel/${channel.owner.username}/qna`)}
          title={t('{{ channel }} Q&A', { channel: channel.title })}
          owner={channel.owner}
          resource_kind="channel"
          thumbnail={channel.thumbnail}
          question
          editor
          refresh
        />
      </Box>
    </Box>
  );
};
