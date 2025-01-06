import { FactCheck, GradingOutlined } from '@mui/icons-material';
import { Chip, Theme, useMediaQuery } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  ExamDisplayResponse as DisplayResponse,
  ExamGetDisplaysData as GetDisplaysData,
  examGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { channelState, userState } from '@/store';

export const Displays = () => {
  const { t } = useTranslation('exam');
  const navigate = useNavigate();
  const user = useAtomValue(userState);
  const channel = useAtomValue(channelState);
  const owner = user && user.id == channel?.owner.id;
  const mobileDown = useMediaQuery((theme: Theme) => theme.breakpoints.down('mobile'));

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="exam"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          mobile: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 251px)',
          lg: 'repeat(4, minmax(251px, 308px))',
        },
      }}
      emptyMessage={<EmptyMessage Icon={FactCheck} message={t('No exam found.')} />}
      extraAction={
        owner &&
        !mobileDown && (
          <Chip color="info" onClick={() => navigate('grading')} icon={<GradingOutlined />} label={t('Grade exams')} />
        )
      }
    />
  );
};
