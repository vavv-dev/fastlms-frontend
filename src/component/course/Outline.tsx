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
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { EnrollDialog } from './EnrollDialog';

import {
  PublicGetOutlineData,
  PublicGetOutlineResponse,
  PublicGetThreadData,
  ThreadResponse,
  publicGetOutline,
  publicGetThread,
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
    <Collapse in={!collapsed}>{children}</Collapse>
  </Box>
);

const SimpleThread = ({ url, data }: { url: string; data: PublicGetOutlineResponse }) => {
  const { t } = useTranslation('course');

  return (
    <Box sx={{ width: '100%', maxWidth: '600px', p: 1 }}>
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

  const { data, mutate } = useServiceImmutable<PublicGetOutlineData, PublicGetOutlineResponse>(publicGetOutline, {
    id: id || '',
    userId: user?.id,
  });

  const url = encodeURIComponent(`${window.location.origin}/course/${id}/outline`);
  const { data: thread } = useServiceImmutable<PublicGetThreadData, ThreadResponse>(publicGetThread, { url, ratingMode: true });

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
          {!mdUp && <SimpleThread data={data} url={url} />}

          {/* Course Details */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title={t('Description')} collapsed={collapsed.description} onToggle={() => toggleSection('description')}>
              {data.description ? (
                <Box sx={{ p: 3 }} className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.description }} />
              ) : (
                <Typography color="text.secondary" sx={{ p: 3 }}>
                  {t('Course description is not ready yet.')}
                </Typography>
              )}
            </Section>

            <Section title={t('Preview')} collapsed={collapsed.preview} onToggle={() => toggleSection('preview')}>
              {data.preview ? (
                <Box
                  sx={{
                    m: 3,
                    position: 'relative',
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    '& iframe': {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: 3,
                      border: 0,
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: data.preview }}
                />
              ) : (
                <Typography color="text.secondary" sx={{ p: 3 }}>
                  {t('Course preview is not ready yet.')}
                </Typography>
              )}
            </Section>

            <Section title={t('Target')} collapsed={collapsed.target} onToggle={() => toggleSection('target')}>
              {data.target ? (
                <Typography sx={{ p: 3 }}>{data.target}</Typography>
              ) : (
                <Typography color="text.secondary" sx={{ p: 3 }}>
                  {t('Course target is not ready yet.')}
                </Typography>
              )}
            </Section>

            <Section title={t('Included lessons')} collapsed={collapsed.lessons} onToggle={() => toggleSection('lessons')}>
              <List dense sx={{ listStyle: 'decimal', pl: 5 }}>
                {data.lessons.map((lesson) => (
                  <ListItem key={lesson.id} sx={{ display: 'list-item' }}>
                    <ListItemText primary={<Typography component="span">{lesson.title}</Typography>} />
                  </ListItem>
                ))}
              </List>
            </Section>
          </Box>

          {/* Sidebar */}
          <Box
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', md: 350 },
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
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
            {mdUp && <SimpleThread data={data} url={url} />}
          </Box>
        </Box>
      </Box>

      {enrollDialogOpen && (
        <EnrollDialog
          open={enrollDialogOpen}
          setOpen={setEnrollDialogOpen}
          id={data.id}
          onEnroll={() => mutate((prev) => prev && { ...prev, enrolled: true }, { revalidate: false })}
        />
      )}
    </Box>
  );
};
