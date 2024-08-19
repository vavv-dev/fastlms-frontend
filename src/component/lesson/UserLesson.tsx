import { LessonDisplayResponse, lessonGetDisplays, LessonGetDisplaysData } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import LessonCard from './LessonCard';
import SaveLessonDialog from './SaveLessonDialog';
import { Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CloudUploadOutlined } from '@mui/icons-material';

const UserLesson = () => {
  const { t } = useTranslation('lesson');
  const navigate = useNavigate();
  const sharedItemTabKey = 'bookmarker';
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;

  return (
    <GridInfiniteScrollPage<LessonDisplayResponse, LessonGetDisplaysData>
      pageKey="lesson"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Lesson I bookmarked'),
        ownedItemTabLabel: t('My lesson'),
      }}
      orderingOptions={[
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={SaveLessonDialog}
      apiService={lessonGetDisplays}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <LessonCard key={item.id} lesson={item} hideAvatar={tab != sharedItemTabKey} showDescription={true} />
          )),
        )
      }
      gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      extraAction={(tab) =>
        tab == 'owner' &&
        owner && <Chip onClick={() => navigate('content')} icon={<CloudUploadOutlined />} label={t('Content upload')} />
      }
      maxWidth="md"
    />
  );
};

export default UserLesson;
