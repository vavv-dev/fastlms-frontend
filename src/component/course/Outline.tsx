import { ArrowDropDown, ArrowDropUp, ReplyAll } from '@mui/icons-material';
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
  Rating,
  Stack,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollRestoration, useLocation, useNavigate, useParams } from 'react-router-dom';

import { EnrollDialog } from './EnrollDialog';

import {
  PublicGetOutlineData as GetOutlineData,
  PublicGetOutlineResponse as GetOutlineResponse,
  PublicGetThreadData as GetThreadData,
  ThreadResponse,
  publicGetOutline as getOutline,
  publicGetThread as getThread,
} from '@/api';
import { Thread } from '@/component/comment';
import { WithAvatar, useServiceImmutable } from '@/component/common';
import { formatYYYMMDD } from '@/helper/util';
import { userState } from '@/store';

interface SectionProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section = ({ title, collapsed, onToggle, children }: SectionProps) => (
  <Box>
    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {title}
      <Divider sx={{ flexGrow: 1 }} />
      <IconButton onClick={onToggle}>{collapsed ? <ArrowDropDown /> : <ArrowDropUp />}</IconButton>
    </Typography>
    <Collapse in={!collapsed} sx={{ p: { xs: 1, sm: 3 } }}>
      {children}
    </Collapse>
  </Box>
);

const RatingThread = ({ url, data, refresh }: { url: string; data: GetOutlineResponse; refresh: boolean }) => {
  const { t } = useTranslation('course');

  return (
    <Box sx={{ width: '100%', maxWidth: '600px', p: 1, '& .refresh-thread': { top: '-1.7em' } }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('Course review')}
      </Typography>
      <Thread
        url={url}
        title={data.title}
        owner={data.owner}
        resource_kind="course"
        thumbnail={data.thumbnail}
        hideHeader
        disableSelect
        disableReply
        ratingMode
        refresh={refresh}
      />
    </Box>
  );
};

export const Outline = () => {
  const { t } = useTranslation('course');
  const { id } = useParams();
  const location = useLocation();
  const user = useAtomValue(userState);
  const navigate = useNavigate();
  const theme = useTheme();
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const { data, mutate } = useServiceImmutable<GetOutlineData, GetOutlineResponse>(getOutline, {
    id: id || '',
    userId: user?.id,
  });

  const url = encodeURIComponent(`${window.location.origin}/course/${id}/outline`);
  const { data: thread } = useServiceImmutable<GetThreadData, ThreadResponse>(getThread, { url, ratingMode: true });

  const openEnroll = () => {
    if (!data) return;
    if (!user) {
      navigate('/login', { state: { from: `/course/${data.id}/outline`, openEnroll: true } });
      return;
    }
    setEnrollDialogOpen(true);
  };

  useEffect(() => {
    if (!data || !user || !location.state?.openEnroll) return;
    if (!data.enrolled) openEnroll();
    delete location.state.openEnroll;
  }, [location.state?.openEnroll, data, user]); // eslint-disable-line

  useEffect(() => {
    if (data && location.state?.enrolled !== undefined) {
      mutate((prev) => prev && { ...prev, enrolled: location.state?.enrolled }, { revalidate: false });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.state?.enrolled, mutate]); // eslint-disable-line

  const firstVideo = useMemo(
    () =>
      data?.lessons.reduce<{ id: string } | null>((found, lesson) => {
        if (found) return found;
        const videoResource = lesson.resources.find((resource) => resource.kind === 'video');
        return videoResource || null;
      }, null),
    [data],
  );

  if (!data) return null;

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box
        sx={{
          bgcolor: theme.palette.common.black,
          p: { xs: 3, sm: 4 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            maxWidth: 'lg',
            width: '100%',
            color: theme.palette.common.white,
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            gap: 3,
            alignItems: 'center',
          }}
        >
          <Box sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {data.title}
            </Typography>
            <WithAvatar {...data.owner} variant="small" color="white">
              <Typography variant="caption">{formatYYYMMDD(data.modified)}</Typography>
            </WithAvatar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={thread?.rating_avg || 0}
                precision={0.5}
                readOnly
                size="large"
                sx={{ '& .MuiRating-iconEmpty': { color: 'rgba(255, 255, 255, 0.7)' } }}
              />
              <Tooltip title={t('Rating count')}>
                <Typography>({thread?.rating_count || 0})</Typography>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {data.featured && <Chip label={t('Featured course')} color="warning" />}
              <Chip label={`${t('Level')}: ${t(data.level)}`} color="primary" />
            </Box>
          </Box>
          <Box
            sx={{
              backgroundImage: `url(${data.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '100%',
              maxWidth: 370,
              aspectRatio: '16 / 9',
              borderRadius: 3,
              border: data.thumbnail ? 'none' : '1px solid',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {!data.thumbnail && <Typography variant="h6">{t('No image')}</Typography>}
          </Box>
        </Box>
      </Box>

      {/* Main Content Section */}
      <Box sx={{ display: 'flex', p: { xs: 2, sm: 4 }, justifyContent: 'center' }}>
        <Box
          sx={{
            maxWidth: 'lg',
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            gap: 5,
          }}
        >
          {!mdUp && <RatingThread data={data} url={url} refresh={!!user} />}

          {/* Course Details */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title={t('Preview')} collapsed={collapsed.preview} onToggle={() => toggleSection('preview')}>
              {data.preview ? (
                <Box dangerouslySetInnerHTML={{ __html: data.preview }} />
              ) : (
                <Preview videoId={firstVideo?.id || ''} />
              )}
            </Section>

            <Section title={t('Description')} collapsed={collapsed.description} onToggle={() => toggleSection('description')}>
              {data.description ? (
                <Box className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.description }} />
              ) : (
                <Typography color="text.secondary">{t('Course description is not ready yet.')}</Typography>
              )}
            </Section>

            <Section title={t('Target')} collapsed={collapsed.target} onToggle={() => toggleSection('target')}>
              {data.target ? (
                <Typography>{data.target}</Typography>
              ) : (
                <Typography color="text.secondary">{t('Course target is not ready yet.')}</Typography>
              )}
            </Section>

            <Section
              title={t('Completion requirements')}
              collapsed={collapsed.target}
              onToggle={() => toggleSection('completion')}
            >
              <Stack spacing={2} direction="row">
                <span>{`${t('Learing days {{ value }} days', { value: data.learning_days })}`}</span>
                <span>{`${t('Progress rate {{ value }}%', { value: data.cutoff_progress })}`}</span>
                <span>{`${t('Total score {{ value }} points(%)', { value: data.cutoff_score })}`}</span>
              </Stack>
            </Section>

            <Section title={t('Lessons')} collapsed={collapsed.lessons} onToggle={() => toggleSection('lessons')}>
              <List dense sx={{ listStyle: 'decimal', pl: '1em' }}>
                {data.lessons.map((lesson) => (
                  <ListItem key={lesson.id} sx={{ display: 'list-item', mb: 1 }}>
                    <ListItemText
                      primary={<Typography sx={{ fontSize: '1.1em', fontWeight: 600 }}>{lesson.title}</Typography>}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 1.2 }}>
                      {lesson.resources.map((resource) => (
                        <Box key={resource.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', overflow: 'auto' }}>
                          {resource.thumbnail && (
                            <Box
                              sx={{
                                height: 60,
                                backgroundImage: `url(${resource.thumbnail})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                bgcolor: 'action.hover',
                                aspectRatio: '16 / 9',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Typography variant="body1">
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ display: 'block' }}
                            >{`[${t(resource.kind)}]`}</Typography>
                            {resource.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Section>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 350 }, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Box
              sx={{
                mt: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Button
                  size="large"
                  onClick={openEnroll}
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ my: 1 }}
                  disabled={data.enrolled}
                >
                  {data.enrolled ? t('Already enrolled in this course') : t('Enroll')}
                </Button>
                <Tooltip title={t('Copy course URL. You can share this URL to introduce this course to others.')}>
                  <IconButton onClick={() => navigator.clipboard.writeText(window.location.href)}>
                    <ReplyAll />
                  </IconButton>
                </Tooltip>
              </Box>
              {data.enrolled && (
                <Button onClick={() => navigate(`/course/${data.id}`)} color="primary" size="small" sx={{ alignSelf: 'center' }}>
                  {t('Go to course')}
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6">
                {t('Certificate')}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('You can get a certificate after completing this course.')}
                </Typography>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.certificate_templates.map((certificate) => (
                  <Box
                    key={certificate.id}
                    component="img"
                    src={certificate.thumbnail}
                    sx={{
                      maxWidth: { xs: '80%', mobile: '300px', md: '250px' },
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: 1,
                      boxShadow: 2,
                    }}
                  />
                ))}
              </Box>
            </Box>

            {mdUp && <RatingThread data={data} url={url} refresh={!!user} />}
          </Box>
        </Box>
      </Box>

      {enrollDialogOpen && (
        <EnrollDialog
          open={enrollDialogOpen}
          setOpen={() => {
            setEnrollDialogOpen(false);
            window.history.replaceState({}, '', window.location.pathname);
          }}
          id={data.id}
          onEnroll={() => mutate((prev) => prev && { ...prev, enrolled: true }, { revalidate: false })}
        />
      )}
      <ScrollRestoration />
    </Box>
  );
};

const Preview = memo(({ videoId }: { videoId: string }) => (
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      maxWidth: '-webkit-fill-available',
      height: 'auto',
      aspectRatio: '16 / 9',
      overflow: 'hidden',
    }}
  >
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        border: 0,
      }}
    />
  </Box>
));
