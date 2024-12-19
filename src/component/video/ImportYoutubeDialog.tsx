import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Button, DialogContentText, LinearProgress } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  VideoDisplayResponse as DisplayResponse,
  ImportYoutubeRequest,
  PlaylistDisplayResponse,
  videoGetDisplays as getDisplays,
  videoImportYoutubeVideo as importYoutubeVideo,
  playlistGetDisplays,
  playlistImportYoutubePlaylist,
} from '@/api';
import { BaseDialog, Form, TextFieldControl as Text, updateInfiniteCache } from '@/component/common';
import { userState } from '@/store';

const createSchema = (t: (key: string) => string) => {
  const schema: yup.ObjectSchema<ImportYoutubeRequest> = yup.object({
    youtube_id: yup.string().required(t('This field is required.')).default(''),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  kind: 'video' | 'short' | 'playlist';
}

export const ImportYoutubeDialog = ({ open, setOpen, kind }: Props) => {
  const { t } = useTranslation('video');
  const user = useAtomValue(userState);

  const schema = useMemo(() => createSchema(t), [t]);
  const { handleSubmit, control, setError, formState, reset, clearErrors } = useForm<ImportYoutubeRequest>({
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
    await (kind == 'video' ? importYoutubeVideo : playlistImportYoutubePlaylist)({ requestBody: data })
      .then((imported) => {
        closeDialog();

        if (kind == 'video' || kind == 'short') {
          updateInfiniteCache<DisplayResponse>(getDisplays, imported as DisplayResponse, 'create');
        } else {
          updateInfiniteCache<PlaylistDisplayResponse>(playlistGetDisplays, imported as PlaylistDisplayResponse, 'create');
        }
      })
      .catch((error) => setError('root.server', error));
  };

  if (!user || !open) return null;

  return (
    <BaseDialog
      isReady
      open={open}
      setOpen={setOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      renderContent={() => (
        <Box sx={{ position: 'relative' }}>
          <Form id="import-youtube" onSubmit={handleSubmit(importYoutube)} formState={formState} setError={setError}>
            <DialogContentText>
              {t('Please enter a Youtube {{ kind }} you want to import.', { kind: t(kind) })}
            </DialogContentText>
            <Text
              autoFocus
              name="youtube_id"
              required
              label={t('Youtube {{ kind }} ID', { kind: t(kind) })}
              control={control}
              slotProps={{ input: { disableUnderline: formState.isSubmitting } }}
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
