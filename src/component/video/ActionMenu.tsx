import { ListAltOutlined, PlaylistAddOutlined } from '@mui/icons-material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { ReportDialog } from './ReportDialog';
import { SaveDialog } from './SaveDialog';

import {
  VideoDisplayResponse as DisplayResponse,
  videoDeleteResource as deleteResource,
  videoGetDisplays as getDisplays,
  videoToggleAction as toggleAction,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu, createToggleAction } from '@/component/common';
import { userState } from '@/store';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('video');
  const user = useAtomValue(userState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [addToPlaylistOpen, setAddtoPlaylistOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => action('bookmark', data)}>
            <ListItemIcon>{data.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {data.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          <MenuItem key="addtoplaylist" onClick={() => setAddtoPlaylistOpen(true)}>
            <ListItemIcon>
              <PlaylistAddOutlined />
            </ListItemIcon>
            {t('Add to playlist')}
          </MenuItem>,

          user.username === data?.owner.username && [
            <MenuItem key="watch-list" onClick={() => setReportDialogOpen(true)}>
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
      {addToPlaylistOpen && <AddToPlaylistDialog open={addToPlaylistOpen} setOpen={setAddtoPlaylistOpen} video={data} />}
      {deleteDialogOpen && (
        <DeleteResourceDialog
          title={t('Video')}
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          resourceId={data.id}
          destroyService={deleteResource}
          listService={getDisplays}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} data={data} />}
    </>
  );
};
