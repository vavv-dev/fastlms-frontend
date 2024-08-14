import {
  ImportYoutubeRequest,
  PlaylistDisplayResponse,
  VideoDisplayResponse,
  playlistGetDisplay,
  playlistImportYoutubePlaylist,
  videoGetDisplay,
  videoImportYoutubeVideo,
} from '@/api';
import { BaseDialog, Form, TextFieldControl, updateInfiniteCache } from '@/component/common';
import i18next from '@/i18n';
import { userState } from '@/store';
import { yupResolver } from '@hookform/resolvers/yup';
import { VideoLibraryOutlined } from '@mui/icons-material';
import { Box, Button, DialogContentText, LinearProgress } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'video' });

const schema: yup.ObjectSchema<ImportYoutubeRequest> = yup.object({
  youtube_id: yup.string().required(t('This field is required.')).default(''),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  kind: 'video' | 'short' | 'playlist';
}

const ImportYoutubeDialog = ({ open, setOpen, kind }: Props) => {
  const { t } = useTranslation('video');
  const user = useAtomValue(userState);
  const { handleSubmit, control, setError, formState, reset, clearErrors } = useForm({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const closeDialog = () => {
    setOpen(false);
    reset();
  };

  const importYoutube = async (data: ImportYoutubeRequest) => {
    if (!user) return;
    clearErrors();
    await (kind == 'video' ? videoImportYoutubeVideo : playlistImportYoutubePlaylist)({ requestBody: data })
      .then((imported) => {
        closeDialog();

        if (kind == 'video' || kind == 'short') {
          updateInfiniteCache<VideoDisplayResponse>(videoGetDisplay, imported as VideoDisplayResponse, 'create');
        } else {
          updateInfiniteCache<PlaylistDisplayResponse>(playlistGetDisplay, imported as PlaylistDisplayResponse, 'create');
        }
      })
      .catch((error) => setError('root.server', error.body));
  };

  if (!user || !open) return null;

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibraryOutlined sx={{ color: 'error.main' }} />
          {t('Import youtube')}
        </Box>
      }
      fullWidth
      maxWidth="sm"
      renderContent={() => (
        <Box sx={{ position: 'relative' }}>
          <Form id="import-youtube" onSubmit={handleSubmit(importYoutube)} formState={formState} setError={setError}>
            <DialogContentText>
              {t('Please enter a Youtube {{ kind }} you want to import.', { kind: t(kind) })}
            </DialogContentText>
            <TextFieldControl
              autoFocus
              name="youtube_id"
              required
              label={t('Youtube {{ kind }} ID', { kind: t(kind) })}
              control={control}
            />
          </Form>
          {formState.isSubmitting && (
            <LinearProgress color="secondary" sx={{ position: 'absolute', width: '100%', bottom: 0 }} />
          )}
        </Box>
      )}
      actions={
        <Button disabled={!formState.isDirty || formState.isSubmitting} form="import-youtube" type="submit">
          {t('Import')}
        </Button>
      }
    />
  );
};

export default ImportYoutubeDialog;
