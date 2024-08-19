import {
  VideoDisplayResponse,
  VideoGetViewData,
  VideoGetViewResponse,
  videoGetDisplays,
  videoGetView,
  videoToggleAction,
} from '@/api';
import { WithAvatar, createToggleAction, useServiceImmutable } from '@/component/common';
import { formatRelativeTime, humanNumber } from '@/helper/util';
import { userState } from '@/store';
import {
  BookmarkBorderOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  ThumbUpOutlined,
} from '@mui/icons-material';
import StreamOutlinedIcon from '@mui/icons-material/StreamOutlined';
import { Box, Button, Chip, Collapse, Divider, IconButton, Stack, ToggleButton, Typography, useTheme } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VideoActionMenu from '../VideoActionMenu';

const VideoControl = ({ videoId }: { videoId: string }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const { data: video } = useServiceImmutable<VideoGetViewData, VideoGetViewResponse>(videoGetView, { id: videoId });
  const [collapse, setCollapse] = useState(true);
  const toggleAction = createToggleAction<VideoDisplayResponse>(videoToggleAction, videoGetDisplays);

  if (!video) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="subtitle1"
        sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', lineHeight: 1.2, mb: '1em', gap: 1 }}
      >
        {video.is_live && (
          <Typography component="span" variant="subtitle2">
            <Chip
              label={t('LIVE')}
              color="error"
              sx={{ borderRadius: '4px', bgcolor: '#da0100', height: '1.8em' }}
              icon={<StreamOutlinedIcon sx={{ fontSize: '1rem' }} />}
            />
          </Typography>
        )}
        {!!video.uploader && `${[video.uploader]}`} {video.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '.5em' }}>
        <WithAvatar variant="large" name={video.owner.name} username={video.owner.username} thumbnail={video.owner.thumbnail} />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={1}>
            <Typography variant="body2">
              {t('Views')} {humanNumber(video.watch_count, t)}
            </Typography>
            {video.modified && <Typography variant="body2">{t(...formatRelativeTime(new Date(video.modified)))}</Typography>}
          </Stack>
          <IconButton onClick={() => toggleAction('bookmark', video)}>
            <BookmarkBorderOutlined color={video.bookmarked ? 'info' : 'inherit'} />
          </IconButton>
          <ToggleButton
            onClick={() => toggleAction('like', video)}
            value="up"
            selected={video.liked}
            size="small"
            sx={{ border: 'none', padding: '.3em 1em', borderRadius: '20px', gap: '.5em' }}
          >
            <ThumbUpOutlined color={video.liked ? 'info' : 'inherit'} />
            {`${t('Likes')} ${humanNumber(video.like_count, t)}`}
          </ToggleButton>
          {user && (
            <Box onClick={(e) => e.stopPropagation()} sx={{ position: 'relative' }}>
              <VideoActionMenu video={video} />
            </Box>
          )}
        </Box>
      </Box>
      <Collapse in={!collapse} collapsedSize={40}>
        <Box
          sx={{
            position: 'relative',
            whiteSpace: 'pre-line',
            overflowWrap: 'anywhere',
            padding: '1em',
            minHeight: '40px',
            bgcolor: theme.palette.action.selected,
            borderRadius: theme.shape.borderRadius / 2,
            cursor: 'pointer',
            fontSize: '.9rem',
          }}
          onClick={() => setCollapse((prev) => !prev)}
        >
          <Button
            sx={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              border: 0,
              borderRadius: '50%',
              p: '.3em',
              minWidth: 0,
              color: 'text.secondary',
            }}
          >
            {collapse ? <KeyboardArrowUpOutlined /> : <KeyboardArrowDownOutlined />}
          </Button>
          <Box dangerouslySetInnerHTML={{ __html: video.description || '' }} />
        </Box>
      </Collapse>
    </Box>
  );
};

export default VideoControl;
