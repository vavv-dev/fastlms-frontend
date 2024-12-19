import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  RadioButtonCheckedOutlined,
  RadioButtonUncheckedOutlined,
} from '@mui/icons-material';
import { Box, LinearProgress, Tooltip, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { ExamQuestionFinding as QuestionFinding } from '@/api';
import { textEllipsisCss, toFixedHuman } from '@/helper/util';

// Lazy load PieChart
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

interface QuestionPanelProps {
  question: QuestionFinding;
  maxOccurrence: number;
  totalOccurrence: number;
  answer?: string;
  isCorrect: boolean;
}

export const FindingQuestionPanel = ({ question, maxOccurrence, totalOccurrence, answer, isCorrect }: QuestionPanelProps) => {
  const { t } = useTranslation('exam');
  const theme = useTheme();
  const { kind, occurrences, selections, correct_answer } = question;

  const renderChart = () => (
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
  );

  return (
    <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {question.kind == 'single_selection' || kind == 'ox_selection' || kind == 'number_input' ? (
        <Grid container spacing={1}>
          {selections?.map((selection, i) => {
            const percentage = maxOccurrence ? ((occurrences?.[i] || 0) / maxOccurrence) * 100 : 0;
            const totalPercentage = totalOccurrence ? ((occurrences?.[i] || 0) / totalOccurrence) * 100 : 0;

            return [
              <Grid key={`selection-${i}`} size={{ xs: 8 }}>
                <Tooltip title={selection} placement="top" arrow>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.secondary',
                      '& .MuiSvgIcon-root': { fontSize: '1em' },
                      position: 'relative',
                    }}
                  >
                    {kind == 'single_selection' || kind == 'ox_selection' ? (
                      <>
                        {Number(answer) == i + 1 ? (
                          <RadioButtonCheckedOutlined sx={{ color: isCorrect ? 'success.main' : 'error.main' }} />
                        ) : (
                          <RadioButtonUncheckedOutlined />
                        )}
                      </>
                    ) : (
                      <>
                        {correct_answer == selection ? (
                          <CheckBoxOutlined sx={{ zIndex: 0, fontSize: '1.5em', color: 'success.main', position: 'absolute' }} />
                        ) : null}
                        {Number(answer) == Number(selection) ? (
                          <CheckBoxOutlined sx={{ color: isCorrect ? 'success.main' : 'error.main' }} />
                        ) : (
                          <CheckBoxOutlineBlankOutlined />
                        )}
                      </>
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
        <>
          {answer && (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('My answer')}
              </Typography>
              <Box
                className="tiptap-content"
                dangerouslySetInnerHTML={{ __html: answer || t('No answer submitted.') }}
                sx={{ '& > p': { mt: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
              />
            </Box>
          )}
          <Typography variant="caption" sx={{ color: 'primary.main' }}>
            {t('Frequently mentioned items in answers.')}
          </Typography>
          {renderChart()}
        </>
      )}
    </Box>
  );
};
