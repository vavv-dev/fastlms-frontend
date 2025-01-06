import { yupResolver } from '@hookform/resolvers/yup';
import { PlaylistPlay } from '@mui/icons-material';
import { Box, Button, Link, Portal, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import * as yup from 'yup';

import {
  PlaylistCheckResponse as CheckResponse,
  PlaylistCheckVideoData as CheckVideoData,
  PlaylistCheckVideoResponse as CheckVideoResponse,
  VideoDisplayResponse,
  PlaylistVideoItem as VideoItem,
  playlistCheckVideo as checkVideo,
  playlistUpdatePlaylistVideos as updatePlaylistVideos,
} from '@/api';
import { BaseDialog, CheckboxControl as Checkbox, EmptyMessage, Form, GridInfiniteScrollPage } from '@/component/common';

interface Props {
  video: VideoDisplayResponse;
  open: boolean;
  setOpen: (open: boolean) => void;
}

type PlaylistVideoItemSelected = VideoItem & { selected: boolean };

const itemSchema: yup.ObjectSchema<PlaylistVideoItemSelected> = yup.object({
  playlist_id: yup.string().default(''),
  video_id: yup.string().default(''),
  order: yup.number().nullable().default(null),
  selected: yup.boolean().default(false),
});

type PlaylistVideoUpdateRequest = { videos: PlaylistVideoItemSelected[] };

const schema: yup.ObjectSchema<PlaylistVideoUpdateRequest> = yup.object({
  videos: yup.array(itemSchema).default([]),
});

export const AddToPlaylistDialog = ({ open, setOpen, video }: Props) => {
  const { t } = useTranslation('video');
  const actionContainer = useRef(null);

  if (!video) return null;

  return (
    <BaseDialog
      isReady
      fullWidth
      open={open}
      setOpen={setOpen}
      maxWidth="sm"
      renderContent={() => (
        <GridInfiniteScrollPage<CheckResponse, CheckVideoData>
          disableSticky
          pageKey="playlist"
          apiService={checkVideo}
          apiOptions={{ videoId: video.id, orderBy: 'created' }}
          renderItem={({ data }) => <PlaylistUpdater data={data} video={video} actionContainer={actionContainer} />}
          emptyMessage={<EmptyMessage Icon={PlaylistPlay} message={t('No playlist found.')} />}
          boxPadding={0}
          gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
        />
      )}
      actions={<Box ref={actionContainer} />}
    />
  );
};

interface PlaylistUpdaterProps {
  data: CheckVideoResponse[] | undefined;
  video: VideoDisplayResponse;
  actionContainer: React.RefObject<null>;
}

const PlaylistUpdater = ({ data, video, actionContainer }: PlaylistUpdaterProps) => {
  const { t } = useTranslation('video');
  const { handleSubmit, control, setValue, setError, formState, reset } = useForm<PlaylistVideoUpdateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const savePlaylist = (data: PlaylistVideoUpdateRequest) => {
    // filter dirty videos
    const dirtyVideos = formState.dirtyFields.videos
      ?.map((_, i) => {
        const d = data.videos[i];
        // order null means remove from playlist
        if (!d.selected) d.order = null;
        return d;
      })
      .filter((v) => v);
    if (!dirtyVideos) return;

    updatePlaylistVideos({ requestBody: { videos: dirtyVideos } })
      .then(() => reset(data))
      .catch((error) => setError('root.server', error));
  };

  useEffect(() => {
    if (!data) return;

    const videos = data
      .flatMap((pagination) => pagination.items)
      .reduce(
        (acc, item, i) => {
          acc[i] = { playlist_id: item.id, video_id: video.id, order: item.video_count, selected: item.is_in };
          return acc;
        },
        [] as (VideoItem & { selected: boolean })[],
      );

    reset({ videos });
  }, [data, setValue, video, reset]);

  return (
    <Form id="addtoplaylist" onSubmit={handleSubmit(savePlaylist)} formState={formState} setError={setError}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="caption" sx={{ mb: 1 }}>
          {t('Select playlist to add or uncheck to remove from playlist.')}
        </Typography>
        {data
          ?.flatMap((pagination) => pagination.items)
          .map((item, i) => (
            <Grid container key={item.id} sx={{ alignItems: 'center' }}>
              <Grid size={10}>
                <Link to={`/playlist/${item.id}`} component={RouterLink} underline="hover">
                  {item.title}
                </Link>
              </Grid>
              <Grid size={2}>
                <Checkbox margin="none" control={control} name={`videos.${i}.selected`} label="" defaultValue={item.is_in} />
              </Grid>
            </Grid>
          ))}
      </Box>

      <Portal container={actionContainer.current}>
        <Button disabled={!formState.isDirty} onClick={() => reset()} color="primary">
          {t('Reset')}
        </Button>
        <Button disabled={!formState.isDirty || formState.isSubmitting} form="addtoplaylist" type="submit" color="primary">
          {t('Save')}
        </Button>
      </Portal>
    </Form>
  );
};
