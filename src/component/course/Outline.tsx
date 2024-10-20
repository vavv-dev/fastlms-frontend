import { PublicGetOutlineData, PublicGetOutlineResponse, publicGetOutline } from '@/api';
import { WithAvatar, useServiceImmutable } from '@/component/common';
import { formatYYYMMDD } from '@/helper/util';
import { userState } from '@/store';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EnrollDialog } from './EnrollDialog';

export const Outline = () => {
  const { t } = useTranslation('course');
  const { id } = useParams();
  const location = useLocation();
  const user = useAtomValue(userState);
  const navigate = useNavigate();
  const theme = useTheme();
  const { data } = useServiceImmutable<PublicGetOutlineData, PublicGetOutlineResponse>(publicGetOutline, { id: id || '' });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const enrollmentEnabled = useMemo(() => {
    if (!data) return false;
    if (
      !data.closed &&
      !data.invitation_required &&
      new Date(data.enrollment_start) < new Date() &&
      (!data.enrollment_end || new Date(data.enrollment_end) > new Date())
    )
      return true;
    return false;
  }, [data]);

  const openEnroll = () => {
    if (!data) return;
    if (!user) {
      navigate('/login', { state: { from: `/course/${data.id}/outline`, openEnroll: true } });
      return;
    }
    setEnrollDialogOpen(true);
  };

  useEffect(() => {
    if (!data || !user) return;
    if (location.state?.openEnroll) {
      openEnroll();
      delete location.state.openEnroll;
    }
  }, [location.state?.openEnroll]); // eslint-disable-line

  if (!data) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: theme.palette.common.black, p: { xs: 3, sm: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Box
          sx={{
            maxWidth: 'lg',
            color: theme.palette.common.white,
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            flexGrow: 1,
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {data.title}
            </Typography>
            <WithAvatar {...data.owner} variant="small" color="white">
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption">{formatYYYMMDD(data.modified)}</Typography>
              </Box>
            </WithAvatar>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              {data.featured && <Chip label={t('Featured course')} color="warning" />}
              <Chip label={`${t('Level')}: ${t(data.level)}`} color="primary" />
            </Stack>
          </Box>
          <Box
            sx={{
              backgroundImage: `url(${data.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: 350,
              aspectRatio: '16 / 9',
              borderRadius: 3,
            }}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', p: { xs: 3, sm: 4 }, justifyContent: 'center' }}>
        <Box
          sx={{
            maxWidth: 'lg',
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            flexGrow: 1,
            gap: 3,
          }}
        >
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* description */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {t('Description')}
                <Divider sx={{ flexGrow: 1 }} />
                <IconButton onClick={() => setCollapsed({ ...collapsed, description: !collapsed.description })}>
                  {collapsed.description ? <ArrowDropDown /> : <ArrowDropUp />}
                </IconButton>
              </Typography>
              <Collapse in={!collapsed.description}>
                <Box sx={{ p: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.description }} />
              </Collapse>
            </Box>

            {/* preview */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {t('Preview')}
                <Divider sx={{ flexGrow: 1 }} />
                <IconButton onClick={() => setCollapsed({ ...collapsed, preview: !collapsed.preview })}>
                  {collapsed.preview ? <ArrowDropDown /> : <ArrowDropUp />}
                </IconButton>
              </Typography>
              <Collapse in={!collapsed.preview}>
                <Box
                  // responsive iframe
                  sx={{
                    m: 3,
                    position: 'relative',
                    width: 'calc(100% - 1em)',
                    maxWidth: 'calc(100% - 1em)',
                    height: 'auto',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    '& iframe': {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 'calc(100% - 1em)',
                      maxWidth: 'calc(100% - 1em)',
                      height: 'auto',
                      aspectRatio: '16 / 9',
                      borderRadius: 3,
                      border: 0,
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: data.preview }}
                />
              </Collapse>
            </Box>

            {/* taget */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {t('Target')}
                <Divider sx={{ flexGrow: 1 }} />
                <IconButton onClick={() => setCollapsed({ ...collapsed, target: !collapsed.target })}>
                  {collapsed.target ? <ArrowDropDown /> : <ArrowDropUp />}
                </IconButton>
              </Typography>
              <Collapse in={!collapsed.target}>
                <Typography variant="body1" sx={{ p: 3 }}>
                  {data.target}
                </Typography>
              </Collapse>
            </Box>

            {/* lessons */}
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {t('Included lessons')}
                <Divider sx={{ flexGrow: 1 }} />
                <IconButton onClick={() => setCollapsed({ ...collapsed, lessons: !collapsed.lessons })}>
                  {collapsed.lessons ? <ArrowDropDown /> : <ArrowDropUp />}
                </IconButton>
              </Typography>
              <Collapse in={!collapsed.lessons}>
                <List dense sx={{ listStyle: 'decimal', pl: 5 }}>
                  {data.lessons.map((lesson) => (
                    <ListItem key={lesson.id} sx={{ display: 'list-item' }}>
                      <ListItemText
                        primary={
                          <Typography component="span" variant="body1">
                            {lesson.title}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 350 } }}>
            <Box
              sx={{
                mt: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <Typography variant="subtitle1" sx={{ display: 'flex', justifyContent: 'center' }}>
                {t('Course enrollment')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>{t('Registration period')}</TableCell>
                      <TableCell>{`${formatYYYMMDD(data.enrollment_start)} ~ ${formatYYYMMDD(data.enrollment_end || '')}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('Learning days')}</TableCell>
                      <TableCell>{t('{{ num }} days', { num: data.learning_days })}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('Course closed')}</TableCell>
                      <TableCell>{data.closed ? t('Yes') : t('No')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('Invitation required for enrollment')}</TableCell>
                      <TableCell>{data.invitation_required ? t('Yes') : t('No')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                onClick={openEnroll}
                variant="contained"
                color="primary"
                fullWidth
                sx={{ my: 1 }}
                disabled={!enrollmentEnabled}
              >
                {t('Enroll')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      {enrollDialogOpen && <EnrollDialog open={enrollDialogOpen} setOpen={setEnrollDialogOpen} id={data.id} />}
    </Box>
  );
};
