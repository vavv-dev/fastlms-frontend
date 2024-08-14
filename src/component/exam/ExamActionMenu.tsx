import { ExamDisplayResponse, examDeleteResource, examGetDisplay, examToggleAction } from '@/api';
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
import SaveExamDialog from './SaveExamDialog';
import ReportDialog from './ReportDialog';

const toggleAction = createToggleAction<ExamDisplayResponse>(examToggleAction, examGetDisplay);

const ExamActionMenu = ({ exam }: { exam: ExamDisplayResponse }) => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const [saveExamDialogOpen, setSaveExamDialogOpen] = useState(false);
  const [deleteExamDialogOpen, setDeleteExamDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', exam)}>
            <ListItemIcon>{exam.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {exam.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === exam?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setReportDialogOpen(true)}>
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
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} exam={exam} />}
    </>
  );
};

export default ExamActionMenu;
