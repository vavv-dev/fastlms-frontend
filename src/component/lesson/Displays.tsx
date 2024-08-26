import {
  LessonDisplayResponse as DisplayResponse,
  lessonGetDisplays as getDisplays,
  LessonGetDisplaysData as GetDisplaysData,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { CloudUploadOutlined } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

export const Displays = () => {
  const { t } = useTranslation('lesson');
  const navigate = useNavigate();
  const sharedItemTabKey = 'bookmarker';
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="lesson"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Lesson I bookmarked'),
        ownedItemTabLabel: t('My lesson'),
      }}
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      apiOptions={{ size: 10 }}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => (
            <Card key={item.id} data={item} hideAvatar={tab != sharedItemTabKey} showDescription={true} />
          )),
        )
      }
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      extraAction={(tab) =>
        tab == 'owner' &&
        owner && <Chip onClick={() => navigate('content')} icon={<CloudUploadOutlined />} label={t('Content upload')} />
      }
      maxWidth="md"
    />
  );
};
