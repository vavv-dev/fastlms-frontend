import {
  CourseDisplayResponse as DisplayResponse,
  CourseGetDisplaysData as GetDisplaysData,
  courseGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { formatYYYMMDD, toFixedHuman } from '@/helper/util';
import { School } from '@mui/icons-material';
import { Box, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CourseCard } from '.';

export const UserCourse = () => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="course"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      apiService={getDisplays}
      apiOptions={{ enrolled: true }}
      renderItem={({ data }) => (
        <Box sx={{ mt: '2em' }}>
          {data?.map((pagination) =>
            pagination.items?.map((item) => (
              <Box
                key={item.id}
                sx={{
                  mx: 'auto',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  ...(smUp ? { width: '100%', mb: '1em' } : { width: '350px', mb: '2em' }),
                }}
              >
                <CourseCard
                  data={item}
                  sx={
                    smUp
                      ? {
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'nowrap',
                          gap: '1em',
                          '.card-banner': {
                            width: '220px',
                            minWidth: '220px',
                            height: 'auto',
                            '& img': { borderRadius: theme.shape.borderRadius / 2, aspectRatio: '16 / 9' },
                          },
                          '.content-title': { fontSize: '1em', mb: 0.5, fontWeight: 600, lineHeight: 1.2 },
                        }
                      : { maxWidth: '400px', alignSelf: 'center', width: '100%' }
                  }
                />

                <Box
                  sx={{
                    ...(smUp ? { position: 'absolute', bottom: '4px', right: '1em' } : {}),
                    display: 'flex',
                    gap: 2,
                    whiteSpace: 'nowrap',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Study period')}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      <Tooltip title={item.study_start} placement="top">
                        <span>{formatYYYMMDD(item.study_start)}</span>
                      </Tooltip>{' '}
                      ~{' '}
                      <Tooltip title={item.study_end} placement="top">
                        <span>{formatYYYMMDD(item.study_end)}</span>
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Progress')}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {toFixedHuman(item.progress, 1)} %
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('Total score')}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {toFixedHuman(item.score, 1)} %
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )),
          )}
        </Box>
      )}
      emptyMessage={<EmptyMessage Icon={School} message={t('No course found.')} />}
      gridBoxSx={{ gap: '.5em 1em', gridTemplateColumns: '1fr' }}
      boxPadding={0}
    />
  );
};
