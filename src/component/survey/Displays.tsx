import {
  SurveyDisplayResponse as DisplayResponse,
  SurveyGetDisplaysData as GetDisplaysData,
  surveyGetDisplays as getDisplays,
} from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

export const Displays = () => {
  const { t } = useTranslation('survey');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="survey"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'submission_count', label: t('Submission count') },
      ]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar={true} />))
      }
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 251px)',
          lg: 'repeat(4, minmax(251px, 308px))',
        },
      }}
    />
  );
};
