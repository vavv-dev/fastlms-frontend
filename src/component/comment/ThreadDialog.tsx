import { Thread } from '@/component/comment';
import { BaseDialog } from '@/component/common';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThreadProps } from '.';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  threadProps: ThreadProps;
  enableSubjectOpen?: boolean;
}

export const ThreadDialog = ({ open, setOpen, threadProps, enableSubjectOpen }: Props) => {
  const { t } = useTranslation('comment');
  const navigate = useNavigate();
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);

  const goToSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    switch (threadProps.resource_kind) {
      case 'video':
      case 'playlist':
      case 'short':
      case 'course':
        navigate(new URL(decodeURIComponent(threadProps.url)).pathname, { replace: true });
        break;
      case 'quiz':
      case 'survey':
      case 'asset':
      case 'exam':
      case 'lesson':
        navigate(location.pathname, {
          replace: true,
          state: {
            dialog: {
              kind: threadProps.resource_kind,
              id: decodeURIComponent(threadProps.url).split('/').pop(),
            },
          },
        });
    }
  };

  return (
    <BaseDialog
      fullWidth
      open={open}
      setOpen={setOpen}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {threadProps.title}
          {enableSubjectOpen && <Button onClick={goToSubject}>{t('View subject')}</Button>}
        </Box>
      }
      minHeight="400px"
      renderContent={() => <Thread {...threadProps} onLoad={() => setLoaded(true)} />}
      sx={{ display: loaded ? 'block' : 'none' }}
    />
  );
};
