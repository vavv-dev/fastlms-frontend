import { PlaylistDisplayResponse, playlistDeleteResource, playlistGetDisplays, playlistToggleAction } from '@/api';
import { DeleteResourceDialog, ResourceActionMenu, createToggleAction } from '@/component/common';
import { userState } from '@/store';
import { ListAltOutlined } from '@mui/icons-material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SavePlaylistDialog from './SavePlaylistDialog';

const toggleAction = createToggleAction<PlaylistDisplayResponse>(playlistToggleAction, playlistGetDisplays);

const PlaylistActionMenu = ({ playlist }: { playlist: PlaylistDisplayResponse }) => {
  const { t } = useTranslation('video');
  const user = useAtomValue(userState);
  const [savePlaylistDialogOpen, setSavePlaylistDialogOpen] = useState(false);
  const [deletePlaylistDialogOpen, setDeletePlaylistDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', playlist)}>
            <ListItemIcon>{playlist.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {playlist.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === playlist?.owner.username && [
            <MenuItem key="watch-list" onClick={() => {}}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Watch list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSavePlaylistDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeletePlaylistDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {savePlaylistDialogOpen && (
        <SavePlaylistDialog open={savePlaylistDialogOpen} setOpen={setSavePlaylistDialogOpen} playlistId={playlist.id} />
      )}
      {deletePlaylistDialogOpen && (
        <DeleteResourceDialog
          title={t('Playlist')}
          open={deletePlaylistDialogOpen}
          setOpen={setDeletePlaylistDialogOpen}
          resourceId={playlist.id}
          destroyService={playlistDeleteResource}
          listService={playlistGetDisplays}
        />
      )}
    </>
  );
};

export default PlaylistActionMenu;
