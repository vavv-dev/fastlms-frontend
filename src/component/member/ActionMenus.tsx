import { SendOutlined } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SaveDialog } from './SaveDialog';

import {
  MemberDisplayResponse as DisplayResponse,
  memberDeleteMember as deleteMember,
  memberDeleteRoster as deleteRoster,
  memberGetDisplays as getDisplays,
  memberInviteUser as inviteUser,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { invitationUrl, userState } from '@/store';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('member');
  const user = useAtomValue(userState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);

  const invite = (username: string) => {
    inviteUser({
      username,
      invitationUrl,
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
            !data.joined_at && (
              <MenuItem key="invite" onClick={() => invite(data.username)}>
                <ListItemIcon>
                  <SendOutlined />
                </ListItemIcon>
                {t('Re-send Invitation')}
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
      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} data={data} />}
      {deleteDialogOpen && (
        <DeleteResourceDialog
          title={t('Delete member')}
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          resourceId={data.id as unknown as string}
          destroyService={data.joined_at ? deleteMember : deleteRoster}
          listService={getDisplays}
        />
      )}
    </>
  );
};
