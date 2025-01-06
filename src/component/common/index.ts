import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

import i18next from '@/i18n';

export { AutocompleteSelect2 } from './AutocompleteSelect2';
export { BaseDialog } from './BaseDialog';
export { CheckboxAutocomplete } from './CheckboxAutocomplete';
export { DeleteResourceDialog } from './DeleteResourceDialog';
export { EmojiPickerWrapper } from './EmojiPickerWrapper';
export { EmptyMessage } from './EmptyMessage';
export {
  CheckboxControl,
  FileFieldControl,
  Form,
  RadioGroupControl,
  SelectControl,
  TextEditorControl,
  TextFieldControl,
} from './FormHelper';
export { GradientCircularProgress } from './GradientCircularProgress';
export { GridInfiniteScrollPage } from './GridInfiniteScrollPage';
export { GridSlider } from './GridSlider';
export { InfiniteScrollIndicator, PaginationActions } from './PaginationActions';
export { ResourceActionMenu } from './ResourceActionMenu';
export { ResourceCard } from './ResourceCard';
export { SaveResourceDialog } from './SaveResourceDialog';
export { SimpleSearch } from './SimpleSearch';
export { TagGroup } from './TagGroup';
export { TextFieldWithFile } from './TextFieldWithFile';
export { WindowButton } from './WindowButton';
export { WithAvatar } from './WithAvatar';
export { useDebounce, useFixMouseLeave, useInfinitePagination, useScrollToFirstError, useServiceImmutable } from './hooks';
export { updateInfiniteCache } from './swr';
export { createToggleAction } from './toggleUserAction';

export const searchFamily = atomFamily(() => atom<string>(''));

// gettext no-op
void [
  i18next.t('Past seconds {{ num }}', { num: 0 }),
  i18next.t('Past minutes {{ num }}', { num: 0 }),
  i18next.t('Past hours {{ num }}', { num: 0 }),
  i18next.t('Past days {{ num }}', { num: 0 }),
  i18next.t('Past weeks {{ num }}', { num: 0 }),
  i18next.t('Past months {{ num }}', { num: 0 }),
  i18next.t('Past years {{ num }}', { num: 0 }),

  i18next.t('humanNumber'),
  i18next.t('unit.k'),
  i18next.t('unit.tk'),
  i18next.t('unit.m'),
  i18next.t('unit.tm'),
  i18next.t('unit.hm'),

  i18next.t('video'),
  i18next.t('short'),
  i18next.t('playlist'),
  i18next.t('asset'),
  i18next.t('quiz'),
  i18next.t('survey'),
  i18next.t('exam'),
  i18next.t('lesson'),
  i18next.t('course'),

  i18next.t('single_selection'),
  i18next.t('multiple_selection'),
  i18next.t('ox_selection'),
  i18next.t('text_input'),
  i18next.t('number_input'),
  i18next.t('essay'),

  i18next.t('midterm_exam'),
  i18next.t('final_exam'),
  i18next.t('general_exam'),
  i18next.t('assignment'),

  i18next.t('Not Found'),
];
