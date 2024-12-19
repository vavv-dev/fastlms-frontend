import { Box } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { View } from './View';

import {
  ExamAttemptResponse as AttemptResponse,
  ExamGetAttemptData as GetAttemptData,
  examGetAttempt as getAttempt,
} from '@/api';
import { BaseDialog, useServiceImmutable } from '@/component/common';
import { GlobalAlert } from '@/component/layout';

interface Props {
  open: boolean;
  setOpen?: (open: boolean) => void;
  id?: string;
  onClose?: () => void;
}

export const ViewDialog = ({ open, setOpen, id: _id, onClose }: Props) => {
  const navigate = useNavigate();
  const { id: __id } = useParams();
  const id = __id || _id;
  const { data, isLoading, isValidating } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id: id || '' });

  if (!open || !id) return null;

  const handleClose = () => {
    if (setOpen) {
      setOpen(false);
    } else {
      navigate(-1);
    }
    onClose?.();
  };

  return (
    <BaseDialog
      isReady={!isLoading && !isValidating}
      fullWidth
      fullScreen={data?.status === 'in_progress'}
      maxWidth={data?.status && ['ready', 'in_progress', 'timeout', 'failed', 'passed'].includes(data?.status) ? 'mdl' : 'sm'}
      open={open}
      setOpen={handleClose}
      renderContent={() => (
        <>
          {data?.status === 'in_progress' && (
            <Box sx={{ position: 'sticky', top: 0, zIndex: 1, width: 'unset !important' }}>
              <GlobalAlert />
            </Box>
          )}
          <View id={id} />
        </>
      )}
      sx={{ '& .MuiDialogContent-root': { padding: 0 } }}
      onClose={handleClose}
    />
  );
};
