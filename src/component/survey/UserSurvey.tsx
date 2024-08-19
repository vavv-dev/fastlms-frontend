import { SurveyDisplayResponse, SurveyGetDisplaysData, surveyGetDisplays } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import SaveSurveyDialog from './SaveSurveyDialog';
import SurveyCard from './SurveyCard';

const UserSurvey = () => {
  const { t } = useTranslation('survey');
  const sharedItemTabKey = 'bookmarker';

  return (
    <GridInfiniteScrollPage<SurveyDisplayResponse, SurveyGetDisplaysData>
      pageKey="survey"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Survey I submitted'),
        ownedItemTabLabel: t('My surveys'),
      }}
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'submission_count', label: t('Submission count') },
      ]}
      CreateItemComponent={SaveSurveyDialog}
      apiService={surveyGetDisplays}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => <SurveyCard key={item.id} survey={item} hideAvatar={tab != sharedItemTabKey} />),
        )
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

export default UserSurvey;
