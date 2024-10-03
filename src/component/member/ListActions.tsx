import {} from '@/api';
import { BaseDialog, ResourceActionMenu } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { MoreHorizOutlined } from '@mui/icons-material';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { Button, DialogContentText, ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { snackbarMessageState } from '../layout';

interface Props {
  selection: number[];
  totalCount?: number;
}

export const ListActions = ({ selection }: Props) => {
  const { t } = useTranslation('member');
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        icon={<MoreHorizOutlined />}
        menuItems={[
          user.username === homeUser?.username && [
            <MenuItem key="delete" onClick={() => setDeleteDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {deleteDialogOpen && (
        <DeleteDialog open={deleteDialogOpen} setOpen={setDeleteDialogOpen} search="" selection={selection} />
      )}
    </>
  );
};

interface DeleteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  selection: number[];
}

const DeleteDialog = ({ open, setOpen, selection }: DeleteDialogProps) => {
  const { t } = useTranslation('member');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const cancelRef = useRef(false);

  void selection;

  const deleteResource = useCallback(() => {
    setSnackbarMessage({
      message: t('Deleting...'),
      duration: 3000,
      action: (
        <Button
          onClick={() => {
            cancelRef.current = true;
            setSnackbarMessage(null);
          }}
          sx={{ color: 'primary.light' }}
        >
          {t('Cancel')}
        </Button>
      ),
    });

    // setTimeout(async () => {
    //   if (!cancelRef.current) {
    //     await destroyService({ id: resourceId }).catch((error) => console.error(error));
    //     // update cache
    //     updateInfiniteCache(listService, { id: resourceId }, 'delete');
    //   }
    //   setSnackbarMessage(null);
    // }, 3000);

    setOpen(false);
  }, [setSnackbarMessage, setOpen, t]);

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={`Delete selected members`}
      renderContent={() => (
        <DialogContentText>
          {t('Are you sure you want to delete? This action will delete all related data.')}
          <br />
          {t('This action cannot be undone.')}
        </DialogContentText>
      )}
      actions={
        <Button onClick={() => deleteResource()} autoFocus>
          {t('Delete')}
        </Button>
      }
    />
  );
};
