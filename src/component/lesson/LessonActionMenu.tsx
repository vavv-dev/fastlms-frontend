import { LessonDisplayResponse, lessonDeleteResource, lessonGetDisplays, lessonToggleAction } from '@/api';
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
import ReportDialog from './ReportDialog';
import SaveLessonDialog from './SaveLessonDialog';

const toggleAction = createToggleAction<LessonDisplayResponse>(lessonToggleAction, lessonGetDisplays);

const LessonActionMenu = ({ lesson }: { lesson: LessonDisplayResponse }) => {
  const { t } = useTranslation('lesson');
  const user = useAtomValue(userState);
  const [saveLessonDialogOpen, setSaveLessonDialogOpen] = useState(false);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', lesson)}>
            <ListItemIcon>{lesson.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {lesson.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === lesson?.owner.username && [
            <MenuItem key="watch-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Watch list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveLessonDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteLessonDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveLessonDialogOpen && (
        <SaveLessonDialog open={saveLessonDialogOpen} setOpen={setSaveLessonDialogOpen} lessonId={lesson.id} />
      )}
      {deleteLessonDialogOpen && (
        <DeleteResourceDialog
          title={t('Lesson')}
          open={deleteLessonDialogOpen}
          setOpen={setDeleteLessonDialogOpen}
          resourceId={lesson.id}
          destroyService={lessonDeleteResource}
          listService={lessonGetDisplays}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} lesson={lesson} />}
    </>
  );
};

export default LessonActionMenu;
