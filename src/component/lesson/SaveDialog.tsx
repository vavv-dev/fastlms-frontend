import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  ResourceSchema as Resource,
  LessonResourceResponse as ResourceResponse,
  LessonResourceUpdateRequest as ResourceUpdateRequest,
  lessonCreateResource as createResource,
  lessonGetDisplays as getDisplays,
  lessonGetResource as getResource,
  sharedResourceSelector as resourceSelector,
  lessonUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ImageSchema, datetimeLocalString } from '@/helper/util';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const resourceSchema: yup.ObjectSchema<Resource> = yup.object({
    kind: yup
      .string()
      .required(REQUIRED)
      .default('video')
      .oneOf(['quiz', 'asset', 'survey', 'video', 'exam'])
      .label(t('Kind'))
      .meta({
        control: 'select',
        options: [
          { value: 'video', label: t('Video') },
          { value: 'asset', label: t('Asset') },
          { value: 'quiz', label: t('Quiz') },
          { value: 'survey', label: t('Survey') },
          { value: 'exam', label: t('Exam') },
        ],
        readOnly: true,
      }),
    sub_kind: yup.string().label(t('Sub kind')).meta({ readOnly: true, control: 'text' }),
    thumbnail: yup.string().default('').meta({ readOnly: true, control: 'thumbnail' }),
    id: yup.string().required(REQUIRED).label(t('ID')).meta({ hidden: true }),
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
    username: yup.string().required(REQUIRED).default('').meta({ hidden: true }),
  });

  const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
    description: yup.string().default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
    is_public: yup
      .boolean()
      .default(false)
      .label(t('Public'))
      .meta({
        control: 'checkbox',
        helperText: t('If not checked, only owner can see this lesson.'),
        grid: 6,
      }),
    featured: yup
      .boolean()
      .default(false)
      .label(t('Featured'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, lesson will be shown in featured list.'),
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
    grading_method: yup
      .string()
      .required(REQUIRED)
      .oneOf(['none', 'progress', 'score'])
      .label(t('Grading method'))
      .meta({
        control: 'select',
        options: [
          { value: 'none', label: t('No grading') },
          { value: 'progress', label: t('Progress') },
          { value: 'score', label: t('Score') },
        ],
        helperText: t('If video or asset is included, select progress. Otherwise, select score.'),
        grid: 6,
      }),
    thumbnail: base64ImageSchema(yup, false, t),
    resources: yup
      .array()
      .of(resourceSchema)
      .required(REQUIRED)
      .label(t('Resources'))
      .min(1, t('At least one item is required'))
      .default([])
      .meta({ orderable: true }),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('lesson');

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
      copyAutocomplete={{
        resources: {
          service: resourceSelector,
          serviceParams: { kinds: ['video', 'asset', 'quiz', 'survey', 'exam'] },
          labelField: 'title',
          groudField: 'kind',
          mode: 'select',
          hideAddButton: true,
        },
      }}
    />
  );
};
