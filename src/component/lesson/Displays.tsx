import { CastForEducation } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  LessonDisplayResponse as DisplayResponse,
  lessonGetDisplays as getDisplays,
  LessonGetDisplaysData as GetDisplaysData,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';


export const Displays = () => {
  const { t } = useTranslation('lesson');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="lesson"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      apiOptions={{ size: 10 }}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      emptyMessage={<EmptyMessage Icon={CastForEducation} message={t('No lesson found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      maxWidth="lg"
    />
  );
};
