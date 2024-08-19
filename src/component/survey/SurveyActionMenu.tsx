import { SurveyDisplayResponse, surveyDeleteResource, surveyGetDisplays, surveyToggleAction } from '@/api';
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
import SaveSurveyDialog from './SaveSurveyDialog';

interface Props {
  survey: SurveyDisplayResponse;
}

const toggleAction = createToggleAction<SurveyDisplayResponse>(surveyToggleAction, surveyGetDisplays);

const SurveyActionMenu = ({ survey }: Props) => {
  const { t } = useTranslation('survey');
  const user = useAtomValue(userState);
  const [saveSurveyDialogOpen, setSaveSurveyDialogOpen] = useState(false);
  const [deleteSurveyDialogOpen, setDeleteSurveyDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => toggleAction('bookmark', survey)}>
            <ListItemIcon>{survey.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {survey.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          user.username === survey?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setReportDialogOpen(true)}>
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
          listService={surveyGetDisplays}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} survey={survey} />}
    </>
  );
};

export default SurveyActionMenu;
