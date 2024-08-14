import { QuizDisplayResponse, quizDeleteResource, quizGetDisplay, quizToggleAction } from '@/api';
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
import SaveQuizDialog from './SaveQuizDialog';

const toggleAction = createToggleAction<QuizDisplayResponse>(quizToggleAction, quizGetDisplay);

const QuizActionMenu = ({ quiz }: { quiz: QuizDisplayResponse }) => {
  const { t } = useTranslation('quiz');
  const user = useAtomValue(userState);
  const [saveQuizDialogOpen, setSaveQuizDialogOpen] = useState(false);
  const [deleteQuizDialogOpen, setDeleteQuizDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', quiz)}>
            <ListItemIcon>{quiz.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {quiz.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === quiz?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Submission list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveQuizDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteQuizDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveQuizDialogOpen && <SaveQuizDialog open={saveQuizDialogOpen} setOpen={setSaveQuizDialogOpen} quizId={quiz.id} />}
      {deleteQuizDialogOpen && (
        <DeleteResourceDialog
          title={t('Quiz')}
          open={deleteQuizDialogOpen}
          setOpen={setDeleteQuizDialogOpen}
          resourceId={quiz.id}
          destroyService={quizDeleteResource}
          listService={quizGetDisplay}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} quiz={quiz} />}
    </>
  );
};

export default QuizActionMenu;
