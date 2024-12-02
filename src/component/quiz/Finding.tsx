import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  RadioButtonCheckedOutlined,
  RadioButtonUncheckedOutlined,
} from '@mui/icons-material';
import { Box, LinearProgress, Tooltip, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizAttemptResponse as AttemptResponse, QuizGetAttemptData as GetAttemptData, quizGetAttempt as getAttempt } from '@/api';
import { useServiceImmutable } from '@/component/common';
import { textEllipsisCss, toFixedHuman } from '@/helper/util';

export const Finding = ({ id }: { id: string }) => {
  const { t } = useTranslation('quiz');
  const theme = useTheme();
  const { data } = useServiceImmutable<GetAttemptData, AttemptResponse>(getAttempt, { id });

  if (!data || !data.finding) return null;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', '& .percentage': { minWidth: 60 } }}>
      <Typography variant="h6">{t('Quiz result finding')}</Typography>
      {Object.entries(data.finding).map(([id, _question], i) => {
        const { question, correct_answer, weight, selections, kind, occurrences } = _question;
        const maxOccurrence = Math.max(...occurrences);
        const totalOccurrence = occurrences.reduce((acc, cur) => acc + cur, 0);
        const answer = Number(data.submission?.answers?.[id]);
        const isCorrect = answer == Number(correct_answer);

        return (
          <Box key={id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              {`${i + 1}. ${question}`}
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'inline', ml: 1 }}>
                {t('{{ num }} Points', { num: weight })}
              </Typography>
            </Typography>
            <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', rowGap: 0, columnGap: 2 }}>
              <Typography component="span" variant="caption" sx={{ display: 'block' }}>
                {t('Correct answer')}: {correct_answer}
              </Typography>
              <Grid container spacing={1}>
                {selections?.map((selection, i) => {
                  const percentage = maxOccurrence ? ((occurrences?.[i] || 0) / maxOccurrence) * 100 : 0;
                  const totalPercentage = totalOccurrence ? ((occurrences?.[i] || 0) / totalOccurrence) * 100 : 0;

                  return [
                    <Grid key={`selection-${i}`} size={{ xs: 6 }}>
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
                          {kind == 'single_selection' ? (
                            <>
                              {answer == i + 1 ? (
                                <RadioButtonCheckedOutlined sx={{ color: isCorrect ? 'success.main' : 'error.main' }} />
                              ) : (
                                <RadioButtonUncheckedOutlined />
                              )}
                            </>
                          ) : (
                            <>
                              {correct_answer == selection ? (
                                <CheckBoxOutlined
                                  sx={{ zIndex: 0, fontSize: '1.5em', color: 'success.main', position: 'absolute' }}
                                />
                              ) : null}
                              {answer == Number(selection) ? (
                                <CheckBoxOutlined sx={{ color: isCorrect ? 'success.main' : 'error.main' }} />
                              ) : (
                                <CheckBoxOutlineBlankOutlined />
                              )}
                            </>
                          )}
                          <Typography variant="body2" color="textSecondary" sx={{ ...textEllipsisCss(1) }}>
                            {selection}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>,
                    <Grid key={`occurrence-${i}`} size={{ xs: 6 }}>
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
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
