import {
  Box,
  Card,
  CardContent,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';

export const Stats = () => {
  const { t } = useTranslation('channel');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 'lg', width: '100%', mx: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 4 }}>
          {t('Channel dashboard')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          {t('Working on...')}
        </Typography>
        <Typography variant="h3" sx={{ mb: 4 }}>
          <Skeleton width={200} />
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid key={item} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    <Skeleton width={100} />
                  </Typography>
                  <Typography variant="h4">
                    <Skeleton width={80} />
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2].map((item) => (
            <Grid key={`chart-${item}`} size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <Skeleton width={150} />
                </Typography>
                <Skeleton variant="rectangular" height={300} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <Skeleton width={150} />
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {[1, 2, 3, 4].map((cell) => (
                    <TableCell key={`header-${cell}`}>
                      <Skeleton width={100} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={`row-${row}`}>
                    {[1, 2, 3, 4].map((cell) => (
                      <TableCell key={`cell-${row}-${cell}`}>
                        <Skeleton width={cell === 1 ? 150 : 100} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};
