import {
  CourseDisplayResponse as DisplayResponse,
  courseGetDisplays as getDisplays,
  courseUpdateResource as updateResource,
} from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime } from '@/helper/util';
import { ReplyOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
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
          <Box
            sx={{
              aspectRatio: '16 / 9',
              backgroundImage: `url(${data.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        }
        score={data.score}
        passed={data.passed}
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
        footer={
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (data.marketing_url) window.open(data.marketing_url, '_blank');
              else navigate(`/course/${data.id}/outline`);
            }}
            sx={{ minWidth: 0, alignSelf: 'flex-start', py: 0 }}
            endIcon={<ReplyOutlined />}
          >
            {t('Go to course overview')}
          </Button>
        }
      />
    </>
  );
};
