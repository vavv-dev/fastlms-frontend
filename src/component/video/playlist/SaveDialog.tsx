import {
  PlaylistResourceResponse as ResourceResponse,
  PlaylistResourceUpdateRequest as ResourceUpdateRequest,
  playlistCreateResource as createResource,
  playlistGetDisplays as getDisplays,
  playlistGetResource as getResource,
  playlistUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ThumbnailSchema } from '@/helper/util';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'video' });

const REQUIRED = t('This field is required.');

const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this playlist.'),
      grid: 4,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, playlist will be shown in featured list.'),
      grid: 4,
    }),
  thumbnail: base64ThumbnailSchema(yup),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('video');
  if (!open) return null;

  return (
    <SaveResourceDialog<ResourceUpdateRequest, ResourceResponse>
      title={t('Playlist')}
      open={open}
      setOpen={setOpen}
      resourceId={id}
      fieldSchema={schema}
      retrieveService={getResource}
      listService={getDisplays}
      createService={createResource}
      partialUpdateService={updateResource}
    />
  );
};
