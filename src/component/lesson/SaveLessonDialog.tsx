import {
  LessonResource,
  LessonResourceResponse,
  LessonResourceUpdateRequest,
  lessonCreateResource,
  lessonGetDisplays,
  lessonGetResource,
  lessonResourceSelector,
  lessonUpdateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'lesson' });

const REQUIRED = t('This field is required.');

const contentSchema: yup.ObjectSchema<LessonResource> = yup.object({
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
  id: yup.string().required(REQUIRED).label(t('ID')).meta({ control: 'text', readOnly: true }),
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
});

const lessonSchema: yup.ObjectSchema<LessonResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().required(REQUIRED).default('').label(t('Description')).meta({ control: 'editor', multiline: true }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this lesson.'),
      grid: 4,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, lesson will be shown in featured list.'),
      grid: 4,
    }),
  resources: yup.array().of(contentSchema).label(t('Resources')).min(1, t('At least one item is required')).default([]),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  lessonId?: string;
}

const SaveLessonDialog = ({ open, setOpen, lessonId }: Props) => {
  const { t } = useTranslation('lesson');

  if (!open) return null;

  return (
    <>
      <SaveResourceDialog<LessonResourceUpdateRequest, LessonResourceResponse>
        title={t('Lesson')}
        open={open}
        setOpen={setOpen}
        resourceId={lessonId}
        fieldSchema={lessonSchema}
        retrieveService={lessonGetResource}
        listService={lessonGetDisplays}
        createService={lessonCreateResource}
        partialUpdateService={lessonUpdateResource}
        copyAutocomplete={{
          resources: {
            service: lessonResourceSelector,
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

export default SaveLessonDialog;
