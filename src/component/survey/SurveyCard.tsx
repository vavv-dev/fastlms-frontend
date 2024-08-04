import { SurveyDisplayResponse } from '@/api';
import ResourceCard from '@/component/common/ResourceCard';
import { snackbarMessageState } from '@/component/layout';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { ReplyAllOutlined } from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SurveyActionMenu from './SurveyActionMenu';
import SurveyViewDialog from './SurveyViewDialog';

interface Props {
  survey: SurveyDisplayResponse;
  hideAvatar?: boolean;
}

const SurveyCard = ({ survey, hideAvatar }: Props) => {
  const { t } = useTranslation('survey');
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [surveyViewDialogOpen, setSurveyViewDialogOpen] = useState(false);

  return (
    <>
      <ResourceCard
        resource={survey}
        onClick={() => setSurveyViewDialogOpen(true)}
        banner={
          <Box sx={{ p: 2, position: 'relative' }}>
            <Typography variant="caption">{t('{{ count }} Question', { count: survey.question_count })}</Typography>
            <Typography variant="subtitle1" sx={{ my: 2, lineHeight: 1.3, whiteSpace: 'pre-wrap', ...textEllipsisCss(3) }}>
              {survey.description}
            </Typography>
            <Tooltip title={t('Share survey link')} arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.id}`).then(() => {
                    setSnackbarMessage({ message: t('Survey link copied'), duration: 2000 });
                  });
                }}
                sx={{ position: 'absolute', right: 4, bottom: 4 }}
              >
                <ReplyAllOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        score={survey.status ? 100 : null}
        passed={survey.status == 'passed'}
        avatarChildren={[
          t(...formatRelativeTime(survey.modified)),
          t('{{ count }} answers', { count: survey.submission_count }),
        ]}
        hideAvatar={hideAvatar}
        actionMenu={<SurveyActionMenu survey={survey} />}
        autoColor
      />
      {surveyViewDialogOpen && (
        <SurveyViewDialog open={surveyViewDialogOpen} setOpen={setSurveyViewDialogOpen} surveyId={survey.id} />
      )}
    </>
  );
};

export default SurveyCard;
