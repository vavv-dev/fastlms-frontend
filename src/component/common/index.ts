import i18next from '@/i18n';
import AutocompleteSelect2 from './AutocompleteSelect2';
import BaseDialog from './BaseDialog';
import DeleteResourceDialog from './DeleteResourceDialog';
import {
  CheckboxControl,
  FileFieldControl,
  Form,
  SelectControl,
  SelectGroupControl,
  TextEditorControl,
  TextFieldControl,
} from './FormHelper';
import GradientCircularProgress from './GradientCircularProgress';
import GridInfiniteScrollPage from './GridInfiniteScrollPage';
import { InfiniteScrollIndicator, PaginationActions } from './PaginationActions';
import ResourceActionMenu from './ResourceActionMenu';
import SaveResourceDialog from './SaveResourceDialog';
import WithAvatar from './WithAvatar';
import { updateInfiniteCache, useDebounce, useFixMouseLeave, useInfinitePagination, useServiceImmutable } from './hooks';

export {
  AutocompleteSelect2,
  BaseDialog,
  CheckboxControl,
  DeleteResourceDialog,
  FileFieldControl,
  Form,
  GradientCircularProgress,
  GridInfiniteScrollPage,
  InfiniteScrollIndicator,
  PaginationActions,
  ResourceActionMenu,
  SaveResourceDialog,
  SelectControl,
  SelectGroupControl,
  TextEditorControl,
  TextFieldControl,
  WithAvatar,
  updateInfiniteCache,
  useDebounce,
  useFixMouseLeave,
  useInfinitePagination,
  useServiceImmutable,
};

// gettext no-op
void [
  i18next.t('Views {{ count }}', { count: 0 }),
  i18next.t('Views {{ count }}k', { count: 0 }),
  i18next.t('Views {{ count }}tk', { count: 0 }),
  i18next.t('Views {{ count }}m', { count: 0 }),
  i18next.t('Views {{ count }}tm', { count: 0 }),
  i18next.t('Views {{ count }}b', { count: 0 }),

  i18next.t('Likes {{ count }}', { count: 0 }),
  i18next.t('Likes {{ count }}k', { count: 0 }),
  i18next.t('Likes {{ count }}tk', { count: 0 }),
  i18next.t('Likes {{ count }}m', { count: 0 }),
  i18next.t('Likes {{ count }}tm', { count: 0 }),
  i18next.t('Likes {{ count }}b', { count: 0 }),

  i18next.t('Past seconds {{ num }}', { num: 0 }),
  i18next.t('Past minutes {{ num }}', { num: 0 }),
  i18next.t('Past hours {{ num }}', { num: 0 }),
  i18next.t('Past days {{ num }}', { num: 0 }),
  i18next.t('Past weeks {{ num }}', { num: 0 }),
  i18next.t('Past months {{ num }}', { num: 0 }),
  i18next.t('Past years {{ num }}', { num: 0 }),
];
