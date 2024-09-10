import {
  CourseDisplayResponse as DisplayResponse,
  courseGetDisplays as getDisplays,
  courseUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common/ResourceCard';
import { decodeURLText, formatRelativeTime, stripHtml, textEllipsisCss } from '@/helper/util';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('course');
  const navigate = useNavigate();

  const onClick = () => {
    navigate(`/course/${data.id}`);
  };

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={onClick}
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
                {stripHtml(decodeURLText(data.description)) || t('Thumbnail or description here')}
              </Typography>
            </Box>
          )
        }
        score={data.score}
        passed={data.status == 'passed'}
        avatarChildren={[
          t(...formatRelativeTime(data.modified)),
          t('{{ count }} enrollments', { count: data.enrollment_count }),
        ]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        autoColor
        partialUpdateService={updateResource}
        listService={getDisplays}
        bannerBorder={!data.thumbnail}
      />
    </>
  );
};
