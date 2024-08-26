import {
  ContentDisplayResponse as DisplayResponse,
  contentDeleteResource as deleteResource,
  contentGetDisplays as getDisplays,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu } from '@/component/common';
import { userState } from '@/store';
import { ListAltOutlined } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import ReportDialog from './ReportDialog';
import { SaveDialog } from './SaveDialog';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('lesson');
  const user = useAtomValue(userState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          user.username === data?.owner.username && [
            <MenuItem key="watch-list" onClick={() => {}}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Watch list')}
            </MenuItem>,
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

      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} id={data.id} />}
      {deleteDialogOpen && (
        <DeleteResourceDialog
          title={t('Content')}
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
