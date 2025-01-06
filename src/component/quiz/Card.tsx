import { Box } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from './ActionMenu';
import { ViewDialog } from './ViewDialog';

import { QuizDisplayResponse as DisplayResponse } from '@/api';
import { ResourceCard } from '@/component/common';
import { formatRelativeTime, textEllipsisCss } from '@/helper/util';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
}

export const Card = ({ data, hideAvatar }: Props) => {
  const { t } = useTranslation('quiz');
  const navigate = useNavigate();
  const [viewOpen, setViewOpen] = useState(false);

  const goToQuiz = () => {
    const courseId = data.context?.course_id;
    const lessonId = data.context?.lesson_id;
    if (courseId && lessonId) {
      navigate(`/course/${courseId}/player`, { state: { resourceLocation: { lesson_id: lessonId, resource_id: data.id } } });
    } else {
      setViewOpen(true);
    }
  };

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={goToQuiz}
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
        bannerBorder={!data.thumbnail}
      />
      {viewOpen && <ViewDialog open={viewOpen} setOpen={setViewOpen} id={data.id} />}
    </>
  );
};
