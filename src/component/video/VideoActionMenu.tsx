import { VideoDisplayResponse, videoDeleteResource, videoGetDisplay, videoToggleAction } from '@/api';
import { DeleteResourceDialog, createToggleAction } from '@/component/common';
import ResourceActionMenu from '@/component/common/ResourceActionMenu';
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
import ReportDialog from './ReportDialog';
import SaveVideoDialog from './SaveVideoDialog';

const toggleAction = createToggleAction<VideoDisplayResponse>(videoToggleAction, videoGetDisplay);

const VideoActionMenu = ({ video }: { video: VideoDisplayResponse }) => {
  const { t } = useTranslation('video');
  const user = useAtomValue(userState);
  const [saveVideoDialogOpen, setSaveVideoDialogOpen] = useState(false);
  const [deleteVideoDialogOpen, setDeleteVideoDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', video)}>
            <ListItemIcon>{video.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {video.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === video?.owner.username && [
            <MenuItem key="watch-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Watch list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveVideoDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteVideoDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveVideoDialogOpen && <SaveVideoDialog open={saveVideoDialogOpen} setOpen={setSaveVideoDialogOpen} videoId={video.id} />}
      {deleteVideoDialogOpen && (
        <DeleteResourceDialog
          title={t('Video')}
          open={deleteVideoDialogOpen}
          setOpen={setDeleteVideoDialogOpen}
          resourceId={video.id}
          destroyService={videoDeleteResource}
          listService={videoGetDisplay}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} video={video} />}
    </>
  );
};

export default VideoActionMenu;
