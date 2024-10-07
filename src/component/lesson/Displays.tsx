import {
  LessonDisplayResponse as DisplayResponse,
  lessonGetDisplays as getDisplays,
  LessonGetDisplaysData as GetDisplaysData,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

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
        data?.map((pagination) =>
          pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar={true} showDescription={true} />),
        )
      }
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      maxWidth="lg"
    />
  );
};
