import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  ResourceSchema as Resource,
  SurveyResourceQuestionUpdate as ResourceQuestionUpdate,
  SurveyResourceResponse as ResourceResponse,
  SurveyResourceUpdateRequest as ResourceUpdateRequest,
  surveyCreateResource as createResource,
  surveyGetDisplays as getDisplays,
  surveyGetOwnedQuestions as getOwnedQuestions,
  surveyGetResource as getResource,
  sharedResourceSelector as resourceSelector,
  surveyUpdateResource as updateResource,
} from '@/api';
import { SaveResourceDialog } from '@/component/common';
import { base64ImageSchema, datetimeLocalString } from '@/helper/util';

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const questionSchema: yup.ObjectSchema<ResourceQuestionUpdate> = yup.object({
    id: yup.number().meta({ control: 'text', hidden: true }),
    kind: yup
      .string()
      .required(REQUIRED)
      .default('single_selection')
      .label(t('Kind'))
      .oneOf(['multiple_selection', 'single_selection', 'number_input', 'text_input'])
      .meta({
        control: 'select',
        options: [
          { value: 'single_selection', label: t('Single selection') },
          { value: 'multiple_selection', label: t('Multiple selection') },
          { value: 'number_input', label: t('Number input') },
          { value: 'text_input', label: t('Text input') },
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
      .transform((value) => {
        return Array.isArray(value)
          ? value
          : value
              .split('\n')
              .filter((v: string) => v.trim())
              .map((v: string) => v.trim());
      })
      .default([])
      .when('kind', ([kind], schema) => {
        return kind == 'single_selection' || kind == 'multiple_selection'
          ? schema.min(2, t("Selection question's choices are at least 2."))
          : schema.max(0, t("Input question's can not have choices."));
      })
      .label(t('Selections'))
      .meta({
        control: 'text',
        multiline: true,
        placeholderText: t('Enter each choice on a new line.'),
      }),
    mandatory: yup.boolean().default(true).label(t('Mandatory')).meta({ control: 'checkbox' }),
  });

  const contentSchema: yup.ObjectSchema<Resource> = yup.object({
    thumbnail: yup.string().default('').meta({ readOnly: true, control: 'thumbnail' }),
    kind: yup.mixed<'video'>().label(t('Kind')).default('video').meta({ readOnly: true, control: 'text' }),
    sub_kind: yup.string().label(t('Sub kind')).meta({ readOnly: true, control: 'text' }),
    id: yup.string().required(REQUIRED).label(t('ID')).meta({ hidden: true }),
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text', readOnly: true }),
    username: yup.string().required(REQUIRED).default('').meta({ hidden: true }),
  });

  const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
    title: yup.string().required(REQUIRED).default('').label(t('Title')).meta({ control: 'text' }),
    description: yup.string().default('').label(t('Description')).meta({ control: 'text', multiline: true }),
    is_public: yup
      .boolean()
      .default(false)
      .label(t('Public'))
      .meta({
        control: 'checkbox',
        helperText: t('If not checked, only owner can see this survey.'),
        grid: 6,
      }),
    featured: yup
      .boolean()
      .default(false)
      .label(t('Featured'))
      .meta({
        control: 'checkbox',
        helperText: t('If checked, survey will be shown in featured list.'),
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
    randomize: yup.boolean().default(true).label(t('Enable question randomize')).meta({ control: 'checkbox', grid: 6 }),
    enable_finding: yup.boolean().default(true).label(t('Enable finding')).meta({ control: 'checkbox', grid: 6 }),
    thumbnail: base64ImageSchema(yup, false, t),
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
    complete_message: yup
      .string()
      .default('')
      .label(t('Complete message'))
      .meta({ control: 'editor', placeholderText: t('Optional') }),
    resources: yup
      .array()
      .max(1, t('Only one video is allowed'))
      .of(contentSchema)
      .label(t('Video'))
      .default([])
      .nullable()
      .meta({ max: 1 }),
    questions: yup
      .array()
      .of(questionSchema)
      .required(REQUIRED)
      .label(t('Questions'))
      .min(1, t('At least one question is required'))
      .default([]),
  });

  return schema;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  id?: string;
}

export const SaveDialog = ({ open, setOpen, id }: Props) => {
  const { t } = useTranslation('survey');

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
          serviceParams: { kinds: 'video' },
          labelField: 'title',
          groudField: 'kind',
          mode: 'select',
          hideAddButton: true,
        },
        questions: {
          service: getOwnedQuestions,
          labelField: 'question',
        },
      }}
    />
  );
};
