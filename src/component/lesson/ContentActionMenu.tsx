import { ContentDisplayResponse, contentDeleteResource, contentGetDisplays } from '@/api';
import { DeleteResourceDialog, ResourceActionMenu } from '@/component/common';
import { userState } from '@/store';
import { ListAltOutlined } from '@mui/icons-material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContentReportDialog from './ContentReportDialog';
import SaveContentDialog from './SaveContentDialog';

const ContentActionMenu = ({ content }: { content: ContentDisplayResponse }) => {
  const { t } = useTranslation('lesson');
  const user = useAtomValue(userState);
  const [saveContentDialogOpen, setSaveContentDialogOpen] = useState(false);
  const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          user.username === content?.owner.username && [
            <MenuItem key="watch-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Watch list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveContentDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteContentDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveContentDialogOpen && (
        <SaveContentDialog open={saveContentDialogOpen} setOpen={setSaveContentDialogOpen} contentId={content.id} />
      )}
      {deleteContentDialogOpen && (
        <DeleteResourceDialog
          title={t('Content')}
          open={deleteContentDialogOpen}
          setOpen={setDeleteContentDialogOpen}
          resourceId={content.id}
          destroyService={contentDeleteResource}
          listService={contentGetDisplays}
        />
      )}
      {reportDialogOpen && <ContentReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} content={content} />}
    </>
  );
};

export default ContentActionMenu;
