import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  AssetResourceResponse as ResourceResponse,
  AssetResourceUpdateRequest as ResourceUpdateRequest,
  assetCreateResource as createResource,
  assetGetDisplays as getDisplays,
  assetGetResource as getResource,
  assetUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ImageSchema, datetimeLocalString } from '@/helper/util';

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
        helperText: t('If not checked, only owner can see this asset.'),
        grid: 6,
      }),
    featured: yup
      .boolean()
      .default(false)
      .label(t('Featured'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, asset will be shown in featured list.'),
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
    sub_kind: yup
      .string()
      .required(REQUIRED)
      .default('html')
      .label(t('Asset kind'))
      .oneOf(['html', 'pdf', 'epub'])
      .meta({
        control: 'select',
        options: [
          { value: 'html', label: t('HTML content') },
          { value: 'pdf', label: t('PDF file') },
          { value: 'epub', label: t('EPUB') },
          // { value: 'pptx', label: t('PPTX presentation'), disabled: true },
        ],
        grid: 6,
      }),
    cutoff_progress: yup
      .number()
      .required(REQUIRED)
      .default(80)
      .label(t('Cutoff progress percent'))
      .meta({
        control: 'number',
        helperText: t('Minimum progress percent for this asset.'),
        grid: 6,
      }),
    duration: yup
      .number()
      .required(REQUIRED)
      .default(60 * 25)
      .label(t('Duration seconds'))
      .max(60 * 60 * 2, t('Maximum duration is 2 hours.'))
      .meta({
        control: 'number',
        helperText: t('Duration in seconds. 1500 means 25 minutes., maximum 7200 seconds(2 hours).'),
        grid: 6,
      }),
    entrypoint: yup
      .string()
      .required(REQUIRED)
      .default('')
      .label(t('Entrypoint/filename'))
      .meta({ control: 'text', grid: 6, helperText: t('Entrypoint/filename for this asset.') }),
    start_date: yup
      .string()
      .required(REQUIRED)
      .label(t('Start date'))
      .default(datetimeLocalString)
      .meta({ control: 'datetime-local', grid: 6 }),
    end_date: yup
      .string()
      .nullable()
      .transform((v) => (v ? v : null))
      .label(t('End date'))
      .meta({ control: 'datetime-local', grid: 6 }),
    thumbnail: base64ImageSchema(yup, true, t),
    uploaded: yup.boolean().default(false).meta({ hidden: true }),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('asset');

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
      createService={createResource}
      partialUpdateService={updateResource}
    />
  );
};
