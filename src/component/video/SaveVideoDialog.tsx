import { Body_VideoUpdateResource, VideoResourceResponse, videoGetDisplay, videoGetResource, videoUpdateResource } from '@/api';
import { SaveResourceDialog } from '@/component/common';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'video' });

const REQUIRED = t('This field is required.');

const videoSchema: yup.ObjectSchema<Body_VideoUpdateResource> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this video.'),
      grid: 4,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, video will be shown in featured list.'),
      grid: 4,
    }),
  passing_percent: yup
    .number()
    .default(80)
    .label(t('Passing percent'))
    .meta({
      control: 'number',
      helperText: t('Passing percent for this video.'),
      grid: 4,
    }),
  thumbnail: yup
    .mixed<any>() // eslint-disable-line
    .meta({ control: 'file', grid: 6, accept: 'image/*' })
    .label(t('Select thumbnail'))
    // unchanged
    .transform((value) => (typeof value === 'string' ? '' : value))
    .test('fileSize', t('File size is too large. Max size is 1MB.'), (value) => {
      if (!value) return true;
      if (Array.isArray(value)) return value.every((v) => v.size <= 1024 * 1024); // 1MB
      return false;
    }),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  videoId?: string;
}

void videoSchema;

const SaveVideoDialog = ({ open, setOpen, videoId }: Props) => {
  const { t } = useTranslation('video');
  if (!open) return null;

  return (
    <SaveResourceDialog<Body_VideoUpdateResource, VideoResourceResponse>
      title={t('Video')}
      open={open}
      setOpen={setOpen}
      resourceId={videoId}
      fieldSchema={videoSchema}
      retrieveService={videoGetResource}
      listService={videoGetDisplay}
      partialUpdateService={videoUpdateResource}
    />
  );
};

export default SaveVideoDialog;
