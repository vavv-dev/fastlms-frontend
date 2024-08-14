import { ExamDisplayResponse, ExamGetDisplayData, examGetDisplay } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { homeUserState, userState } from '@/store';
import { GradingOutlined } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ExamCard from './ExamCard';
import SaveExamDialog from './SaveExamDialog';

const UserExam = () => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();
  const sharedItemTabKey = 'bookmarker';
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;

  return (
    <GridInfiniteScrollPage<ExamDisplayResponse, ExamGetDisplayData>
      pageKey="exam"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Exam I submitted'),
        ownedItemTabLabel: t('My exams'),
      }}
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'submission_count', label: t('Submission count') },
      ]}
      CreateItemComponent={SaveExamDialog}
      apiService={examGetDisplay}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => <ExamCard key={item.id} exam={item} hideAvatar={tab != sharedItemTabKey} />),
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
      extraAction={(tab) =>
        tab == 'owner' &&
        owner && <Chip color="info" onClick={() => navigate('grading')} icon={<GradingOutlined />} label={t('Grade exams')} />
      }
    />
  );
};

export default UserExam;
