import { SurveyDisplayResponse, surveyDeleteResource, surveyGetDisplay, surveyToggleAction } from '@/api';
import { DeleteResourceDialog, updateInfiniteCache } from '@/component/common';
import ResourceActionMenu from '@/component/common/ResourceActionMenu';
import { userState } from '@/store';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SaveSurveyDialog from './SaveSurveyDialog';
import { ListAltOutlined } from '@mui/icons-material';
import SubmissionListDialog from './SubmissionListDialog';

interface Props {
  survey: SurveyDisplayResponse;
}

const SurveyActionMenu = ({ survey }: Props) => {
  const { t } = useTranslation('survey');
  const user = useAtomValue(userState);
  const [saveSurveyDialogOpen, setSaveSurveyDialogOpen] = useState(false);
  const [deleteSurveyDialogOpen, setDeleteSurveyDialogOpen] = useState(false);
  const [submissionListDialogOpen, setSubmissionListDialogOpen] = useState(false);

  const toggleAction = (action: 'bookmark' | 'like' | 'flag') => {
    surveyToggleAction({ id: survey.id, action })
      .then(() =>
        updateInfiniteCache<SurveyDisplayResponse>(
          surveyGetDisplay,
          { id: survey.id, bookmarked: !survey.bookmarked },
          'update',
        ),
      )
      .catch((error) => console.error(error));
  };

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark')}>
            <ListItemIcon>{survey.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {survey.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === survey?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setSubmissionListDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Submission list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveSurveyDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteSurveyDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveSurveyDialogOpen && (
        <SaveSurveyDialog open={saveSurveyDialogOpen} setOpen={setSaveSurveyDialogOpen} surveyId={survey.id} />
      )}
      {deleteSurveyDialogOpen && (
        <DeleteResourceDialog
          title={t('Survey')}
          open={deleteSurveyDialogOpen}
          setOpen={setDeleteSurveyDialogOpen}
          resourceId={survey.id}
          destroyService={surveyDeleteResource}
          listService={surveyGetDisplay}
        />
      )}
      {submissionListDialogOpen && (
        <SubmissionListDialog open={submissionListDialogOpen} setOpen={setSubmissionListDialogOpen} survey={survey} />
      )}
    </>
  );
};

export default SurveyActionMenu;
