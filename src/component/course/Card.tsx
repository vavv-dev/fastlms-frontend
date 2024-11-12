import { ReplyAllOutlined } from '@mui/icons-material';
import { Box, IconButton, SxProps, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';

import {
  CourseDisplayResponse as DisplayResponse,
  courseGetDisplays as getDisplays,
  courseUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  sx?: SxProps;
}

export const Card = ({ data, hideAvatar, sx }: Props) => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();

  return (
    <ResourceCard
      resource={data}
      onClick={() => (data.enrolled ? navigate(`/course/${data.id}`) : navigate('.', { state: { dialog: data } }))}
      banner={
        <Box sx={{ position: 'relative' }}>
          {data.thumbnail ? (
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
          )}

          <Tooltip title={t('Go to course overview')}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                if (data.marketing_url) window.open(data.marketing_url, '_blank');
                else navigate(`/course/${data.id}/outline`);
              }}
              color="primary"
              sx={{ position: 'absolute', bottom: 0, right: 0 }}
            >
              <ReplyAllOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      }
      score={data.score}
      passed={data.passed}
      avatarChildren={[
        t(...formatRelativeTime(data.modified)),
        data.enrolled && (
          <Typography variant="caption" color="success">
            {t('Enrolled')}
          </Typography>
        ),
      ]}
      hideAvatar={hideAvatar}
      actionMenu={<ActionMenu data={data} />}
      autoColor
      partialUpdateService={updateResource}
      listService={getDisplays}
      bannerBorder={!data.thumbnail}
      sx={sx}
    />
  );
};
