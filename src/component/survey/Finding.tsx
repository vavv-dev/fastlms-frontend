import { CheckBoxOutlined, RadioButtonCheckedOutlined } from '@mui/icons-material';
import { Box, Divider, LinearProgress, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SurveyAttemptResponse as AttemptResponse,
  SurveyGetAttemptData as GetAttemptData,
  surveyGetAttempt as getAttempt,
} from '@/api';
import { useServiceImmutable } from '@/component/common';
import { textEllipsisCss, toFixedHuman } from '@/helper/util';

const PieChart = lazy(() =>
  import('@mui/x-charts/PieChart').then((module) => ({
    default: module.PieChart,
  })),
);

// Loading component for Suspense fallback
const ChartLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
    <LinearProgress sx={{ width: '50%' }} />
  </Box>
);

export const Finding = ({ id }: { id: string }) => {
  const { t } = useTranslation('survey');
  const theme = useTheme();
  const { data } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });

  if (!data || !data.finding) return null;

  const renderChart = (selections: string[], occurrences: number[]) => (
    <>
      <Typography variant="caption" sx={{ color: 'primary.main' }}>
        {t('Frequently mentioned items in answers.')}
      </Typography>
      <Suspense fallback={<ChartLoader />}>
        <PieChart
          slotProps={{ noDataOverlay: { message: t('No data to display.') } }}
          colors={theme.palette.colorList}
          series={[
            {
              data: selections?.map((selection, i) => ({
                id: i,
                label: `${selection} (${occurrences?.[i] || 0})`,
                value: occurrences?.[i] || 0,
              })),
              cx: 110,
              arcLabel: (item) => String(item.value),
              innerRadius: 20,
              paddingAngle: 2,
              cornerRadius: 2,
            },
          ]}
          height={200}
          sx={{
            '& .MuiChartsLegend-series *': { fontSize: theme.typography.body2.fontSize },
          }}
        />
      </Suspense>
    </>
  );

  return (
    <Stack
      spacing={3}
      divider={<Divider />}
      sx={{ p: 2, width: '100%', '& .MuiFormLabel-root': { mb: 2, fontWeight: 500, color: 'text.primary' } }}
    >
      <Box sx={{ px: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.final_message }} />

      {Object.entries(data.finding).map(([id, { kind, question, mandatory, occurrences, selections }], i) => {
        const maxOccurrence = Math.max(...occurrences);
        const totalOccurrence = occurrences.reduce((acc, cur) => acc + cur, 0);

        return (
          <Box key={id} sx={{ display: 'flex', flexDirection: 'column', gap: 3, '& .percentage': { minWidth: 60 } }}>
            <Typography>{`${i + 1}. ${!mandatory ? t('(Optional)') : ''} ${question}`}</Typography>
            <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {kind == 'single_selection' || kind == 'multiple_selection' ? (
                <Grid container spacing={1}>
                  {selections?.map((selection, i) => {
                    const percentage = maxOccurrence ? ((occurrences?.[i] || 0) / maxOccurrence) * 100 : 0;
                    const totalPercentage = totalOccurrence ? ((occurrences?.[i] || 0) / totalOccurrence) * 100 : 0;

                    return [
                      <Grid key={`selection-${i}`} size={{ xs: 8 }}>
                        <Tooltip title={selection} placement="top" arrow>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            {kind == 'single_selection' ? (
                              <RadioButtonCheckedOutlined sx={{ color: 'text.secondary', fontSize: '1em' }} />
                            ) : (
                              <CheckBoxOutlined sx={{ color: 'text.secondary', fontSize: '1em' }} />
                            )}

                            <Typography variant="body2" sx={{ color: 'text.secondary', ...textEllipsisCss(1) }}>
                              {selection}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>,
                      <Grid key={`occurrence-${i}`} size={{ xs: 4 }}>
                        <Tooltip title={`${toFixedHuman(totalPercentage, 1)}%`} placement="top" arrow>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                flexGrow: 1,
                                mr: 1,
                                height: 10,
                                bgcolor: theme.palette.action.disabledBackground,
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: occurrences[i] == maxOccurrence ? theme.palette.info.main : theme.palette.info.light,
                                },
                                borderRadius: 1,
                              }}
                            />
                            <Typography className="percentage" variant="body2" align="right">
                              {toFixedHuman(totalPercentage, 1)}% ({occurrences?.[i] || 0})
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>,
                    ];
                  })}
                </Grid>
              ) : (
                renderChart(selections, occurrences)
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};
