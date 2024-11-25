import { useNavigate, useParams } from 'react-router-dom';

import { ViewDialog } from './ViewDialog';

export const ViewDialogOpener = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) return null;

  const handleClose = () => {
    navigate(-1);
  };

  return <ViewDialog open={true} setOpen={handleClose} onClose={handleClose} id={id} />;
};
