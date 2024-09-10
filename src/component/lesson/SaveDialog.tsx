import {
  LessonEmbedResource as Resource,
  LessonResourceResponse as ResourceResponse,
  LessonResourceUpdateRequest as ResourceUpdateRequest,
  lessonCreateResource as createResource,
  lessonGetDisplays as getDisplays,
  lessonGetResource as getResource,
  lessonResourceSelector as resourceSelector,
  lessonUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ThumbnailSchema, datetimeLocalString } from '@/helper/util';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'lesson' });

const REQUIRED = t('This field is required.');

const contentSchema: yup.ObjectSchema<Resource> = yup.object({
  kind: yup
    .string()
    .required(REQUIRED)
    .default('video')
    .oneOf(['quiz', 'survey', 'video', 'exam', 'content'])
    .label(t('Kind'))
    .meta({
      control: 'select',
      options: [
        { value: 'video', label: t('Video') },
        { value: 'quiz', label: t('Quiz') },
        { value: 'survey', label: t('Survey') },
        { value: 'exam', label: t('Exam') },
        { value: 'content', label: t('Content') },
      ],
      readOnly: true,
    }),
  thumbnail: yup.string().default('').meta({ readOnly: true, control: 'thumbnail' }),
  id: yup.string().required(REQUIRED).label(t('ID')).meta({ control: 'text', readOnly: true }),
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
});

const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().required(REQUIRED).default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
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
  thumbnail: base64ThumbnailSchema(yup),
  resources: yup
    .array()
    .of(contentSchema)
    .label(t('Resources'))
    .min(1, t('At least one item is required'))
    .default([])
    .meta({ orderable: true }),
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
        title={t('Lesson')}
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
            labelField: 'title',
            groudField: 'kind',
            mode: 'select',
            hideAddButton: true,
          },
        }}
      />
    </>
  );
};
