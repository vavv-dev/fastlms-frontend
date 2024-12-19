import { Poll } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  SurveyDisplayResponse as DisplayResponse,
  SurveyGetDisplaysData as GetDisplaysData,
  surveyGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';


export const Displays = () => {
  const { t } = useTranslation('survey');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="survey"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      emptyMessage={<EmptyMessage Icon={Poll} message={t('No survey found.')} />}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          mobile: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 251px)',
          lg: 'repeat(4, minmax(251px, 308px))',
        },
      }}
    />
  );
};
