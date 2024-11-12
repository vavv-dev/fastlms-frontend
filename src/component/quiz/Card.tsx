import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';

import {
  QuizDisplayResponse as DisplayResponse,
  quizGetDisplays as getDisplays,
  quizUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('quiz');
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
          <Box
            sx={{ p: 2, aspectRatio: '16 / 9', ...textEllipsisCss(3) }}
            className="tiptap-content"
            dangerouslySetInnerHTML={{ __html: data.description || t('Thumbnail or description here') }}
          />
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
    />
  );
};
