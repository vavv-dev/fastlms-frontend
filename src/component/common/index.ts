import i18next from '@/i18n';

export { AutocompleteSelect2 } from './AutocompleteSelect2';
export { BaseDialog } from './BaseDialog';
export { DeleteResourceDialog } from './DeleteResourceDialog';
export {
  CheckboxControl,
  FileFieldControl,
  Form,
  SelectControl,
  SelectGroupControl,
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
export { WithAvatar } from './WithAvatar';
export { updateInfiniteCache, useDebounce, useFixMouseLeave, useInfinitePagination, useServiceImmutable } from './hooks';
export { createToggleAction } from './toggleUserAction';
export { uppyFamily } from './uppy';

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
];
