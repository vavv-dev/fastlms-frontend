import { ExamDisplayResponse, examDeleteResource, examGetDisplay, examToggleAction } from '@/api';
import { DeleteResourceDialog, updateInfiniteCache } from '@/component/common';
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
import SaveExamDialog from './SaveExamDialog';
import SubmissionListDialog from './SubmissionListDialog';

const ExamActionMenu = ({ exam }: { exam: ExamDisplayResponse }) => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const [saveExamDialogOpen, setSaveExamDialogOpen] = useState(false);
  const [deleteExamDialogOpen, setDeleteExamDialogOpen] = useState(false);
  const [submissionListDialogOpen, setSubmissionListDialogOpen] = useState(false);

  const toggleAction = (action: 'bookmark' | 'like' | 'flag') => {
    examToggleAction({ id: exam.id, action })
      .then(() =>
        updateInfiniteCache<ExamDisplayResponse>(examGetDisplay, { id: exam.id, bookmarked: !exam.bookmarked }, 'update'),
      )
      .catch((error) => console.error(error));
  };

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark')}>
            <ListItemIcon>{exam.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {exam.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === exam?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setSubmissionListDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Submission list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveExamDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteExamDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveExamDialogOpen && <SaveExamDialog open={saveExamDialogOpen} setOpen={setSaveExamDialogOpen} examId={exam.id} />}
      {deleteExamDialogOpen && (
        <DeleteResourceDialog
          title={t('Exam')}
          open={deleteExamDialogOpen}
          setOpen={setDeleteExamDialogOpen}
          resourceId={exam.id}
          destroyService={examDeleteResource}
          listService={examGetDisplay}
        />
      )}
      {submissionListDialogOpen && (
        <SubmissionListDialog open={submissionListDialogOpen} setOpen={setSubmissionListDialogOpen} exam={exam} />
      )}
    </>
  );
};

export default ExamActionMenu;
