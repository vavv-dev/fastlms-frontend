import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  CertificateTemplateSchema,
  CourseResourceLesson as Lesson,
  CourseResourceResponse as ResourceResponse,
  CourseResourceUpdateRequest as ResourceUpdateRequest,
  certificateTemplateSelector,
  courseCreateResource as createResource,
  courseGetDisplays as getDisplays,
  courseGetResource as getResource,
  sharedResourceSelector as resourceSelector,
  courseUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ImageSchema, datetimeLocalString } from '@/helper/util';

const createSchema = (t: (key: string, options?: Record<string, unknown>) => string) => {
  const REQUIRED = t('This field is required.');
  const INVALID_URL = t('Invalid URL.');
  const INVALID_IFRAME = t('Invalid iframe code.');

  const lessonSchema: yup.ObjectSchema<Lesson> = yup.object({
    id: yup.string().required(REQUIRED).label(t('ID')).meta({ control: 'text', readOnly: true }),
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
    weight: yup
      .number()
      .required(REQUIRED)
      .min(0, t('Minimum value is {{ min }}.', { min: 0 }))
      .max(100, t('Maximum value is {{ max }}.', { max: 100 }))
      .default(0)
      .label(t('Grade weight %'))
      .meta({ control: 'number' }),
  });

  const certificateTemplatesSchema: yup.ObjectSchema<CertificateTemplateSchema> = yup.object({
    thumbnail: yup.string().default('').meta({ readOnly: true, control: 'thumbnail' }),
    id: yup.string().required(REQUIRED).label(t('ID')).meta({ control: 'text', readOnly: true }),
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
  });

  const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
    description: yup.string().default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
    thumbnail: base64ImageSchema(yup, true, t).meta({ grid: 12 }),
    is_public: yup
      .boolean()
      .default(false)
      .label(t('Public'))
      .meta({
        control: 'checkbox',
        helperText: t('If not checked, only owner can see this course.'),
        grid: 4,
      }),
    featured: yup
      .boolean()
      .default(false)
      .label(t('Featured'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, course will be shown in featured list.'),
        grid: 4,
      }),
    emon_managed_course: yup.boolean().default(false).label(t('Emon managed course')).meta({ control: 'checkbox', grid: 4 }),
    invitation_required: yup
      .boolean()
      .default(false)
      .label(t('Invitation required'))
      .meta({ control: 'checkbox', grid: 4, helperText: t('If checked, only invited users can enroll.'), disabled: true }),
    closed: yup
      .boolean()
      .default(false)
      .label(t('Closed'))
      .meta({ control: 'checkbox', grid: 4, helperText: t('If checked, course will be frozen.') }),
    learning_days: yup
      .number()
      .typeError(REQUIRED)
      .required(REQUIRED)
      .default(60)
      .label(t('Learning days'))
      .meta({ control: 'number', grid: 4 }),
    registration_limit: yup
      .number()
      .typeError(REQUIRED)
      .required(REQUIRED)
      .default(0)
      .label(t('Registration limit'))
      .meta({ control: 'number', grid: 4, helperText: t('0 means no limit') }),
    cutoff_progress: yup
      .number()
      .typeError(REQUIRED)
      .required()
      .default(80)
      .label(t('Cutoff progress %'))
      .meta({ control: 'number', grid: 4, helperText: t('Minimum progress percent') }),
    cutoff_score: yup
      .number()
      .typeError(REQUIRED)
      .required(REQUIRED)
      .default(60)
      .label(t('Cutoff score %'))
      .meta({ control: 'number', grid: 4, helperText: t('Minimum score percent') }),
    level: yup
      .string()
      .required(REQUIRED)
      .default('general')
      .label(t('Level'))
      .oneOf(['general', 'beginner', 'intermediate', 'advanced'])
      .meta({
        control: 'select',
        options: [
          { value: 'general', label: t('General') },
          { value: 'beginner', label: t('Beginner') },
          { value: 'intermediate', label: t('Intermediate') },
          { value: 'advanced', label: t('Advanced') },
        ],
        grid: 4,
      }),
    sequential_learning: yup
      .boolean()
      .default(true)
      .label(t('Sequential learning'))
      .meta({
        control: 'checkbox',
        grid: 4,
        helperText: t('If checked, user must complete lessons and all resources in order.'),
      }),
    start_date: yup
      .string()
      .label(t('Start date'))
      .required(REQUIRED)
      .default(datetimeLocalString)
      .meta({ control: 'datetime-local', grid: 6 }),
    end_date: yup
      .string()
      .nullable()
      .transform((v) => (v ? v : null))
      .label(t('End date'))
      .meta({ control: 'datetime-local', grid: 6 }),
    enrollment_start: yup
      .string()
      .label(t('Enrollment start'))
      .required(REQUIRED)
      .default(datetimeLocalString)
      .meta({ control: 'datetime-local', grid: 6 }),
    enrollment_end: yup
      .string()
      .nullable()
      .transform((v) => (v ? v : null))
      .label(t('Enrollment end'))
      .meta({ control: 'datetime-local', grid: 6 }),
    target: yup.string().default('').label(t('Target')).meta({ control: 'text', multiline: true }),
    preview: yup
      .string()
      .default('')
      .label(t('Preview iframe code'))
      .test('is-iframe', INVALID_IFRAME, (value) => {
        if (!value) return true;
        return value.includes('<iframe');
      })
      .meta({ control: 'text', helperText: t('Insert iframe code for preview') }),
    marketing_url: yup
      .string()
      .default('')
      .url(INVALID_URL)
      .label(t('Marketing url'))
      .meta({ control: 'text', helperText: t('If you want to use another marketing page, insert URL here.') }),
    certificate_templates: yup
      .array()
      .max(2, t('Maximum value is {{ max }}.', { max: 2 }))
      .of(certificateTemplatesSchema)
      .label(t('Certificate template. If not selected, certificate will not be disabled.'))
      .default([])
      .nullable()
      .meta({ max: 2 }),
    lessons: yup
      .array()
      .required(REQUIRED)
      .of(lessonSchema)
      .max(100, t('Maximum value is {{ max }}.', { max: 100 }))
      .label(t('Lessons'))
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
  const { t } = useTranslation('course');

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
        certificate_templates: {
          service: certificateTemplateSelector,
          labelField: 'title',
          mode: 'select',
          hideAddButton: true,
        },
        lessons: {
          service: resourceSelector,
          serviceParams: { kinds: ['lesson'] },
          labelField: 'title',
          mode: 'select',
          hideAddButton: true,
        },
      }}
      maxWidth="lg"
    />
  );
};
