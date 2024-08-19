import { QuizDisplayResponse, quizGetDisplays, QuizGetDisplaysData } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { useTranslation } from 'react-i18next';
import QuizCard from './QuizCard';
import SaveQuizDialog from './SaveQuizDialog';

const UserQuiz = () => {
  const { t } = useTranslation('quiz');
  const sharedItemTabKey = 'bookmarker';

  return (
    <GridInfiniteScrollPage<QuizDisplayResponse, QuizGetDisplaysData>
      pageKey="quiz"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Quiz I answered'),
        ownedItemTabLabel: t('My quizzes'),
      }}
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'submission_count', label: t('Submission asc') },
      ]}
      CreateItemComponent={SaveQuizDialog}
      apiService={quizGetDisplays}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => <QuizCard key={item.id} quiz={item} hideAvatar={tab != sharedItemTabKey} />),
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

export default UserQuiz;
