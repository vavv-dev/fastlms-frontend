import {
  SurveyDisplayResponse as DisplayResponse,
  surveyGetDisplays as getDisplays,
  surveyUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common/ResourceCard';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenu';
import { ViewDialog } from './ViewDialog';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('survey');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const videoId = data.resources?.find((r) => r.kind === 'video')?.id ?? null;

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => setViewDialogOpen(true)}
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
            <Box sx={{ p: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.secondary',
                  my: 1,
                  lineHeight: 1.3,
                  whiteSpace: 'pre-wrap',
                  ...textEllipsisCss(3),
                }}
              >
                {data.description || t('Thumbnail or description here')}
              </Typography>
            </Box>
          )
        }
        score={data.status ? 100 : null}
        passed={data.status == 'passed'}
        avatarChildren={[t(...formatRelativeTime(data.modified)), t('{{ count }} answers', { count: data.submission_count })]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        autoColor
        partialUpdateService={updateResource}
        listService={getDisplays}
        bannerBorder={!data.thumbnail}
        footer={
          videoId && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('Video is available')}
            </Typography>
          )
        }
      />
      {viewDialogOpen && <ViewDialog open={viewDialogOpen} setOpen={setViewDialogOpen} id={data.id} />}
    </>
  );
};
