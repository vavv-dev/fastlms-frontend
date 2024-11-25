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

import { ActionMenu } from './ActionMenu';

import {
  VideoDisplayResponse as DisplayResponse,
  VideoGetViewData as GetViewData,
  VideoGetViewResponse as GetViewResponse,
  videoGetDisplays as getDisplays,
  videoGetView as getView,
  videoToggleAction as toggleAction,
} from '@/api';
import { WithAvatar, createToggleAction, useServiceImmutable } from '@/component/common';
import { decodeURLText, formatRelativeTime, humanNumber, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';

export const Control = ({ id }: { id: string }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const { data, mutate } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id: id });
  const [collapse, setCollapse] = useState(true);

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays);

  const handleAction = (type: 'like' | 'bookmark') => {
    if (!data) return;
    action(type, data);
    mutate(
      (prev) => {
        if (!prev) return;
        if (type === 'like') {
          return { ...prev, liked: !prev.liked, like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1 };
        }
        if (type === 'bookmark') {
          return { ...prev, bookmarked: !prev.bookmarked };
        }
        return prev;
      },
      { revalidate: false },
    );
  };

  if (!data) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="subtitle1"
        sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', lineHeight: 1.2, mb: '1em', gap: 1 }}
      >
        {data.sub_kind === 'live' && (
          <Typography component="span" variant="subtitle2">
            <Chip
              label={t('LIVE')}
              color="error"
              sx={{ borderRadius: '4px', bgcolor: '#da0100', height: '1.8em' }}
              icon={<StreamOutlinedIcon sx={{ fontSize: '1rem' }} />}
            />
          </Typography>
        )}
        {!!data.uploader && `${[data.uploader]}`} {data.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '.5em' }}>
        <WithAvatar variant="large" {...data.owner}>
          <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={1}>
            {data.modified && <Typography variant="body2">{t(...formatRelativeTime(new Date(data.modified)))}</Typography>}
          </Stack>
        </WithAvatar>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => handleAction('bookmark')}>
            <BookmarkBorderOutlined color={data.bookmarked ? 'info' : 'inherit'} />
          </IconButton>
          <ToggleButton
            onClick={() => handleAction('like')}
            value="up"
            selected={data.liked}
            size="small"
            sx={{ border: 'none', padding: '.3em 1em', borderRadius: '20px', gap: '.5em' }}
          >
            <ThumbUpOutlined color={data.liked ? 'info' : 'inherit'} />
            <Box sx={{ display: { xs: 'none', sm: 'inherit' } }}>{t('Likes')}</Box>
            {humanNumber(data.like_count, t)}
          </ToggleButton>
          {user && (
            <Box onClick={(e) => e.stopPropagation()} sx={{ position: 'relative' }}>
              <ActionMenu data={data} />
            </Box>
          )}
        </Box>
      </Box>
      {data.description && (
        <Collapse in={!collapse} collapsedSize={40} timeout={50}>
          <Box
            sx={{
              position: 'relative',
              whiteSpace: 'pre-line',
              overflowWrap: 'anywhere',
              padding: '1em',
              minHeight: '40px',
              bgcolor: theme.palette.action.hover,
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
            <Box
              className="tiptap-content"
              dangerouslySetInnerHTML={{ __html: decodeURLText(data.description) }}
              sx={{ '& > p': { my: 0 }, ...(collapse && textEllipsisCss(1)) }}
            />
          </Box>
        </Collapse>
      )}
    </Box>
  );
};
