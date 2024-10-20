import {
  SurveyDisplayResponse as DisplayResponse,
  surveyGetDisplays as getDisplays,
  surveyUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('survey');
  const navigate = useNavigate();

  return (
    <ResourceCard
      resource={data}
      onClick={() => navigate('.', { state: { dialog: data } })}
      banner={
        data.thumbnail ? (
          <Box
            sx={{
              aspectRatio: '16 / 9',
              backgroundImage: `url(${data.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <Typography
            variant="subtitle2"
            sx={{
              p: 2,
              aspectRatio: '16 / 9',
              color: 'text.secondary',
              lineHeight: 1.3,
              whiteSpace: 'pre-wrap',
              ...textEllipsisCss(3),
            }}
          >
            {data.description || t('Thumbnail or description here')}
          </Typography>
        )
      }
      score={data.score}
      passed={data.passed}
      inProgress={data.status == 'in_progress'}
      avatarChildren={[t(...formatRelativeTime(data.modified))]}
      hideAvatar={hideAvatar}
      actionMenu={<ActionMenu data={data} />}
      autoColor
      partialUpdateService={updateResource}
      listService={getDisplays}
      bannerBorder={!data.thumbnail}
      footer={
        data.status !== null && (
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate('.', { state: { dialog: { question: true, ...data } } });
            }}
            sx={{ minWidth: 0, alignSelf: 'flex-start', py: 0 }}
          >
            {t('Q&A')}
          </Button>
        )
      }
    />
  );
};
