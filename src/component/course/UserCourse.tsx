import { School } from '@mui/icons-material';
import { Box, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { CourseCard } from '.';

import {
  CourseDisplayResponse as DisplayResponse,
  CourseGetDisplaysData as GetDisplaysData,
  courseGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { formatYYYMMDD, toFixedHuman } from '@/helper/util';

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
                  justifySelf: { xs: 'center', sm: 'inherit' },
                  width: '100%',
                  margin: '0 auto',
                  position: 'relative',
                  ...(smUp ? { maxWidth: '100%', mb: '1em' } : { maxWidth: '344px', mb: '2em' }),
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
                      : {}
                  }
                  footer={
                    <Box
                      sx={{
                        ...(smUp ? { position: 'absolute', bottom: '4px', right: '1em' } : { mt: '1em' }),
                        display: 'flex',
                        gap: 2,
                        whiteSpace: 'nowrap',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {t('Study period')}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          <Tooltip title={item.learning_start} placement="top">
                            <span>{formatYYYMMDD(item.learning_start)}</span>
                          </Tooltip>{' '}
                          ~{' '}
                          <Tooltip title={item.learning_end} placement="top">
                            <span>{formatYYYMMDD(item.learning_end)}</span>
                          </Tooltip>
                        </Typography>
                      </Box>
                      {item.certificates.length > 0 ? (
                        <Tooltip title={t('Certificate issued')} placement="bottom" arrow>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {item.certificates.map((certificate, i) => (
                              <Box
                                component="img"
                                src={certificate.thumbnail}
                                key={i}
                                sx={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                                }}
                              />
                            ))}
                          </Box>
                        </Tooltip>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('Progress')}
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {toFixedHuman(item.progress, 1)}%
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">
                              {t('Score')}
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {toFixedHuman(item.score, 1)}%
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  }
                />
              </Box>
            )),
          )}
        </Box>
      )}
      emptyMessage={<EmptyMessage Icon={School} message={t('No course found.')} />}
      gridBoxSx={{ gridTemplateColumns: { xs: 'repeat(1, minmax(0, 1fr))' } }}
      boxPadding={0}
    />
  );
};
