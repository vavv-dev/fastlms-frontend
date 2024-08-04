import {
  ExamResourceQuestionComposition,
  ExamResourceQuestionUpdate,
  ExamResourceResponse,
  ExamResourceUpdateRequest,
  examCreateResource,
  examGetDisplay,
  examGetOwnedQuestions,
  examGetResource,
  examUpdateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'exam' });

const REQUIRED = t('This field is required.');

const questionSchema: yup.ObjectSchema<ExamResourceQuestionUpdate> = yup.object({
  id: yup.number().meta({ control: 'text', hidden: true }),
  kind: yup
    .string()
    .required(REQUIRED)
    .default('single_selection')
    .label(t('Kind'))
    .oneOf(['single_selection', 'ox_selection', 'text_input', 'number_input', 'essay'])
    .meta({
      control: 'select',
      options: [
        { value: 'single_selection', label: t('Single selection') },
        { value: 'ox_selection', label: t('OX selection') },
        { value: 'text_input', label: t('Text input') },
        { value: 'number_input', label: t('Number input') },
        { value: 'essay', label: t('Essay') },
      ],
    }),
  question: yup.string().required(REQUIRED).default('').label(t('Question')).meta({ control: 'text', multiline: true }),
  help_text: yup
    .string()
    .default('')
    .label(t('Help text'))
    .meta({ control: 'text', placeholderText: t('Optional') }),
  selections: yup
    .array()
    .of(yup.string().required(REQUIRED))
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split(',')
            .filter((v: string) => v.trim())
            .map((v: string) => v.trim()),
    )
    .default([])
    .when('kind', ([kind], schema) => {
      return kind == 'single_selection' || kind == 'multiple_selection'
        ? schema.min(2, t("Selection question's choices are at least 2."))
        : schema.max(0, t('Input question can not have choices.'));
    })
    .label(t('Selections'))
    .meta({ control: 'text', multiline: true }),
  weight: yup.number().default(1).label(t('Weight')).required(REQUIRED).meta({ control: 'number' }),
  correct_answer: yup
    .string()
    .when('kind', ([kind], schema) => {
      return kind == 'single_selection' || kind == 'ox_selection' || kind == 'number_input'
        ? schema.required(REQUIRED).label(t('Correct answer'))
        : schema.label(t('Correct answer'));
    })
    .default('')
    .label(t('Correct answer'))
    .meta({ control: 'text' }),
  answer_criteria: yup.string().default('').label(t('Answer creteria')).meta({ control: 'text', multiline: true }),
  explanation: yup.string().default('').label(t('Explanation')).meta({ control: 'text', multiline: true }),
  reference: yup.string().default('').label(t('Reference')).meta({ control: 'text' }),
  keywords: yup.string().default('').label(t('Keywords')).meta({ control: 'text' }),
});

const questionCompositionSchema: yup.ObjectSchema<ExamResourceQuestionComposition> = yup
  .object({
    single_selection: yup.number().default(0).label(t('Single selection')).meta({ control: 'number', grid: 3 }),
    ox_selection: yup.number().default(0).label(t('OX selection')).meta({ control: 'number', grid: 3 }),
    text_input: yup.number().default(0).label(t('Text input')).meta({ control: 'number', grid: 3 }),
    number_input: yup.number().default(0).label(t('Number input')).meta({ control: 'number', grid: 3 }),
    essay: yup.number().default(0).label(t('Essay')).meta({ control: 'number', grid: 3 }),
  })
  .label(t('Question composition'));

const examSchema: yup.ObjectSchema<ExamResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().default('').label(t('Description')).meta({ control: 'text', multiline: true }),
  exam_kind: yup
    .string()
    .required(REQUIRED)
    .default('general_exam')
    .label(t('Exam kind'))
    .oneOf(['midterm_exam', 'final_exam', 'assignment', 'general_exam'])
    .meta({
      control: 'select',
      options: [
        { value: 'midterm_exam', label: t('Midterm exam') },
        { value: 'final_exam', label: t('Final exam') },
        { value: 'assignment', label: t('Assignment') },
        { value: 'general_exam', label: t('General exam') },
      ],
      grid: 4,
    }),
  duration: yup
    .number()
    .default(60)
    .min(1, t('Duration must be greater than 1 minute.'))
    .label(t('Duration'))
    .required(REQUIRED)
    .meta({ control: 'number', grid: 4 }),
  cutoff_percent: yup.number().default(0).label(t('Cutoff %')).meta({ control: 'number', grid: 4 }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this exam.'),
      grid: 6,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, exam will be shown in featured list.'),
      grid: 6,
    }),
  verification_required: yup.boolean().default(false).label(t('Verification required')).meta({ control: 'checkbox', grid: 6 }),
  randomize: yup.boolean().default(true).label(t('Enable question randomize')).meta({ control: 'checkbox', grid: 6 }),
  enable_finding: yup.boolean().default(true).label(t('Enable finding')).meta({ control: 'checkbox', grid: 6 }),
  start_date: yup
    .string()
    .label(t('Start date'))
    .default(() => {
      const datetime = new Date();
      const tzOffset = datetime.getTimezoneOffset() * 60000;
      return new Date(datetime.getTime() - tzOffset).toISOString().slice(0, 16);
    })
    .meta({ control: 'datetime-local', grid: 6 }),
  end_date: yup.string().required(REQUIRED).default('').label(t('End date')).meta({ control: 'datetime-local', grid: 6 }),
  success_message: yup
    .string()
    .default('')
    .label(t('Success message'))
    .meta({ control: 'editor', placeholderText: t('Optional') }),
  failure_message: yup
    .string()
    .default('')
    .label(t('Failure message'))
    .meta({ control: 'editor', placeholderText: t('Optional') }),
  embed: yup.object().default({}).label(t('Embed')).meta({ hidden: true, control: 'text' }),
  question_composition: questionCompositionSchema,
  questions: yup.array().of(questionSchema).label(t('Questions')).default([]),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  examId?: string;
}

const SaveExamDialog = ({ open, setOpen, examId }: Props) => {
  const { t } = useTranslation('exam');

  if (!open) return null;

  return (
    <SaveResourceDialog<ExamResourceUpdateRequest, ExamResourceResponse>
      title={t('Exam')}
      open={open}
      setOpen={setOpen}
      resourceId={examId}
      fieldSchema={examSchema}
      retrieveService={examGetResource}
      listService={examGetDisplay}
      createService={examCreateResource}
      partialUpdateService={examUpdateResource}
      copyAutocomplete={{
        questions: {
          service: examGetOwnedQuestions,
          labelField: 'question',
        },
      }}
      maxWidth="xl"
    />
  );
};

export default SaveExamDialog;
