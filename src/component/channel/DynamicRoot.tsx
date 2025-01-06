import { Pending } from '@mui/icons-material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Home } from './Home';

import { AssetDisplays } from '@/component/asset';
import { EmptyMessage } from '@/component/common';
import { CourseDisplays } from '@/component/course';
import { ExamDisplays } from '@/component/exam';
import { LessonDisplays } from '@/component/lesson';
import { QuizDisplays } from '@/component/quiz';
import { SurveyDisplays } from '@/component/survey';
import { PlaylistDisplays, VideoDisplays } from '@/component/video';
import { channelState } from '@/store';


export const DynamicRoot = () => {
  const { t } = useTranslation('channel');
  const channel = useAtomValue(channelState);

  if (!channel) return null;

  let Component = null;

  // using component directly for performance reason

  switch (channel.active_resources[0]) {
    case undefined:
      return <EmptyMessage sx={{ my: 3 }} Icon={Pending} message={t('Channel is in preparation.')} />;
    case 'home':
      Component = Home;
      break;
    case 'video':
    case 'short':
      return <VideoDisplays kind={channel.active_resources[0]} />;
    case 'playlist':
      Component = PlaylistDisplays;
      break;
    case 'asset':
      Component = AssetDisplays;
      break;
    case 'quiz':
      Component = QuizDisplays;
      break;
    case 'survey':
      Component = SurveyDisplays;
      break;
    case 'exam':
      Component = ExamDisplays;
      break;
    case 'lesson':
      Component = LessonDisplays;
      break;
    case 'course':
      Component = CourseDisplays;
      break;
    default:
      return null;
  }

  return <Component />;
};
