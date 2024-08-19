import { LessonGetViewData, LessonGetViewResponse, lessonGetView } from '@/api';
import { useServiceImmutable } from '@/component/common/hooks';
import { Box, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';

const Lesson = () => {
  const { lessonId } = useParams();
  const { data: lesson } = useServiceImmutable<LessonGetViewData, LessonGetViewResponse>(lessonGetView, { id: lessonId || '' });

  if (!lesson) return null;

  return (
    <Box sx={{ display: 'block', maxWidth: 'xxl', width: '100%', m: 'auto' }}>
      <Grid
        container
        sx={{
          maxWidth: 'xxl',
          alignSelf: 'center',
          p: { xs: 0, md: 3 },
          pt: '1em !important',
          gap: { xs: 0, md: 3 },
          flexWrap: { xs: 'wrap', playerSplit: 'nowrap' },
        }}
      >
        <Grid
          item
          sx={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: { xs: '100%', md: '650px' },
            '& > :not(div:first-of-type)': {
              px: { xs: 3, md: 0 },
            },
          }}
        >
          hello
        </Grid>
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: { xs: 3, md: 0 },
            width: '100%',
            maxWidth: { playerSplit: '402px' },
          }}
        ></Grid>
      </Grid>
    </Box>
  );
};

export default Lesson;
