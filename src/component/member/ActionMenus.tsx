import { MemberDisplayResponse as DisplayResponse, memberGetDisplays as getDisplays, memberInviteUser } from '@/api';
import { DeleteResourceDialog, ResourceActionMenu } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { userState } from '@/store';
import { SendOutlined } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('member');
  const user = useAtomValue(userState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const inviteUser = (username: string) => {
    memberInviteUser({
      username,
      invitationUrl: `${window.location.origin}/invitation-accept`,
    }).then(() => {
      setSnackbarMessage({ message: t('Invitation sent.'), duration: 3000 });
    });
  };

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          [
            !data.id && (
              <MenuItem key="save" onClick={() => inviteUser(data.username)}>
                <ListItemIcon>
                  <SendOutlined />
                </ListItemIcon>
                {t('Send Invitation')}
              </MenuItem>
            ),
            <MenuItem key="save" onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
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
        <DeleteResourceDialog
          title={t('Member')}
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          resourceId={data.id}
          destroyService={deleteResource}
          listService={getDisplays}
        />
      )}
    </>
  );
};
