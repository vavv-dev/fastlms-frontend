import {
  Body_ContentUpdateResource,
  ContentResourceResponse,
  contentCreateResource,
  contentGetDisplays,
  contentGetResource,
  contentUpdateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'lesson' });

const REQUIRED = t('This field is required.');

const contentSchema: yup.ObjectSchema<Body_ContentUpdateResource> = yup.object({
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
  passing_percent: yup
    .number()
    .required(REQUIRED)
    .typeError(REQUIRED)
    .label(t('Passing %'))
    .meta({ control: 'number', grid: 6, placeholderText: '80' }),
  thumbnail: yup
    .mixed<any>() // eslint-disable-line
    .meta({ control: 'file', grid: 6, accept: 'image/*' })
    .label(t('Select thumbnail'))
    // if unchanged, set empty string
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
  contentId?: string;
}

const SaveContentDialog = ({ open, setOpen, contentId }: Props) => {
  const { t } = useTranslation('lesson');

  if (!open) return null;

  return (
    <>
      <SaveResourceDialog<Body_ContentUpdateResource, ContentResourceResponse>
        title={t('Content')}
        open={open}
        setOpen={setOpen}
        resourceId={contentId}
        fieldSchema={contentSchema}
        retrieveService={contentGetResource}
        listService={contentGetDisplays}
        createService={contentCreateResource as any} // eslint-disable-line
        partialUpdateService={contentUpdateResource}
      />
    </>
  );
};

export default SaveContentDialog;
