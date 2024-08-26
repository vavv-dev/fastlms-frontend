import {
  ContentResourceResponse as ResourceResponse,
  ContentResourceUpdateRequest as ResourceUpdateRequest,
  contentCreateResource as createResource,
  contentGetDisplays as getDisplays,
  contentGetResource as getResource,
  contentUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ThumbnailSchema } from '@/helper/util';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'lesson' });

const REQUIRED = t('This field is required.');

const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this content.'),
      grid: 6,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, content will be shown in featured list.'),
      grid: 6,
    }),
  index_page: yup
    .string()
    .required(REQUIRED)
    .default('')
    .label(t('Index page'))
    .meta({ control: 'text', grid: 6, helperText: t('Index page file name of content'), placeholderText: 'index.html' }),
  duration: yup
    .number()
    .required(REQUIRED)
    .typeError(REQUIRED)
    .label(t('Duration'))
    .meta({ control: 'number', grid: 6, helperText: t('Content duration in minutes'), placeholderText: '25' }),
  cutoff_progress: yup
    .number()
    .required(REQUIRED)
    .typeError(REQUIRED)
    .label(t('Cutoff progress %'))
    .meta({ control: 'number', grid: 6, placeholderText: '80', helperText: t('Minimum progress percent') }),
  uploaded: yup.boolean().meta({ hidden: true }),
  thumbnail: base64ThumbnailSchema(yup),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('lesson');

  if (!open) return null;

  return (
    <>
      <SaveResourceDialog<ResourceUpdateRequest, ResourceResponse>
        title={t('Content')}
        open={open}
        setOpen={setOpen}
        resourceId={id}
        fieldSchema={schema}
        retrieveService={getResource}
        listService={getDisplays}
        createService={createResource}
        partialUpdateService={updateResource}
      />
    </>
  );
};

