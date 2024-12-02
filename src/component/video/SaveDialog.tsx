import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  VideoResourceResponse as ResourceResponse,
  VideoResourceUpdateRequest as ResourceUpdateRequest,
  videoGetDisplays as getDisplays,
  videoGetResource as getResource,
  videoUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ImageSchema } from '@/helper/util';

const createSchema = (t: (key: string) => string) => {
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
        helperText: t('If not checked, only owner can see this video.'),
        grid: 6,
      }),
    featured: yup
      .boolean()
      .default(false)
      .label(t('Featured'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, video will be shown in featured list.'),
        grid: 6,
      }),
    hide_from_list: yup
      .boolean()
      .default(false)
      .label(t('Hide from list'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, will not be shown in list. But it can be accessed directly. Useful for embed only content.'),
        grid: 6,
      }),
    cutoff_progress: yup
      .number()
      .default(80)
      .label(t('Cutoff progress percent'))
      .meta({
        control: 'number',
        helperText: t('Minimum progress percent for this video.'),
        grid: 6,
      }),
    sub_kind: yup
      .string()
      .required(REQUIRED)
      .default('video')
      .label(t('Video kind'))
      .oneOf(['video', 'short', 'live'])
      .meta({
        control: 'select',
        options: [
          { value: 'video', label: t('Video') },
          { value: 'short', label: t('Short video') },
          { value: 'live', label: t('Live video') },
        ],
        grid: 6,
        helperText: t(
          'Videos under 60 seconds are automatically classified as shorts. You can change this manually. Please refresh after making changes.',
        ),
      }),
    thumbnail: base64ImageSchema(yup, false, t),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('video');

  const schema = useMemo(() => createSchema(t), [t]);

  if (!open) return null;

  return (
    <SaveResourceDialog<ResourceUpdateRequest, ResourceResponse>
      open={open}
      setOpen={setOpen}
      resourceId={id}
      fieldSchema={schema}
      retrieveService={getResource}
      listService={getDisplays}
      partialUpdateService={updateResource}
    />
  );
};
