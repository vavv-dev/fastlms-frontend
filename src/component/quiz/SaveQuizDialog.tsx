import {
  QuizResourceQuestionUpdate,
  QuizResourceResponse,
  QuizResourceUpdateRequest,
  quizCreateResource,
  quizGetDisplay,
  quizGetOwnedQuestions,
  quizGetResource,
  quizUpdateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import i18next from '@/i18n';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const t = (key: string) => i18next.t(key, { ns: 'quiz' });

const REQUIRED = t('This field is required.');

const questionSchema: yup.ObjectSchema<QuizResourceQuestionUpdate> = yup.object({
  id: yup.number().meta({ control: 'text', hidden: true }),
  kind: yup
    .string()
    .required(REQUIRED)
    .default('single_selection')
    .label(t('Kind'))
    .oneOf(['single_selection', 'number_input'])
    .meta({
      control: 'select',
      options: [
        { value: 'single_selection', label: t('Single selection') },
        { value: 'number_input', label: t('Number input') },
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
      return kind == 'single_selection'
        ? schema.min(2, t("Selection question's choices are at least 2."))
        : schema.max(0, t("Input question's can not have choices."));
    })
    .label(t('Selections'))
    .meta({ control: 'text', multiline: true }),
  weight: yup.number().default(1).label(t('Weight')).required(REQUIRED).meta({ control: 'number' }),
  correct_answer: yup.string().required(REQUIRED).default('').label(t('Correct answer')).meta({ control: 'number' }),
});

const quizSchema: yup.ObjectSchema<QuizResourceUpdateRequest> = yup.object({
  title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
  description: yup.string().default('').label(t('Description')).meta({ control: 'text', multiline: true }),
  is_public: yup
    .boolean()
    .default(false)
    .label(t('Public'))
    .meta({
      control: 'checkbox',
      helperText: t('If not checked, only owner can see this quiz.'),
      grid: 6,
    }),
  featured: yup
    .boolean()
    .default(false)
    .label(t('Featured'))
    .meta({
      control: 'checkbox',
      helperText: t('If checked, quiz will be shown in featured list.'),
      grid: 6,
    }),
  randomize: yup.boolean().default(true).label(t('Enable question randomize')).meta({ control: 'checkbox', grid: 6 }),
  enable_finding: yup.boolean().default(true).label(t('Enable finding')).meta({ control: 'checkbox', grid: 6 }),
  cutoff_percent: yup.number().default(0).label(t('Cutoff %')).meta({ control: 'number', grid: 6 }),
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
  questions: yup.array().of(questionSchema).label(t('Questions')).default([]),
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  quizId?: string;
}

const SaveQuizDialog = ({ open, setOpen, quizId }: Props) => {
  const { t } = useTranslation('quiz');

  if (!open) return null;

  return (
    <SaveResourceDialog<QuizResourceUpdateRequest, QuizResourceResponse>
      title={t('Quiz')}
      open={open}
      setOpen={setOpen}
      resourceId={quizId}
      fieldSchema={quizSchema}
      retrieveService={quizGetResource}
      listService={quizGetDisplay}
      createService={quizCreateResource}
      partialUpdateService={quizUpdateResource}
      copyAutocomplete={{
        questions: {
          service: quizGetOwnedQuestions,
          labelField: 'question',
        },
      }}
    />
  );
};

export default SaveQuizDialog;
