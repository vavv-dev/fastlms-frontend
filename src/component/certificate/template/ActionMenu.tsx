import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  TemplateDisplayResponse as DisplayResponse,
  certificateDeleteResource as deleteResource,
  certificateGetDisplays as getDisplays,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu } from '@/component/common';
import { userState } from '@/store';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('certificate');
  const user = useAtomValue(userState);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          user.username === data?.owner.username && [
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
          title={t('Certificate')}
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
