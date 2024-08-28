import i18next from '@/i18n';
import { atom } from 'jotai';
import ReactPlayer from 'react-player/youtube';

export { Displays as VideoDisplays } from './Displays';
export { View as VideoView } from './View';
export { Displays as PlaylistDisplays } from './playlist/Displays';
export { View as PlaylistView } from './playlist/View';
export { Input as SearchInput } from './search/Input';
export { SearchResult as VideoSearchResult } from './search/Result';

export const activeVideoIdState = atom<string | null>(null);
export const playerHeightState = atom<string>('');
export const playerInstanceState = atom<ReactPlayer | null>(null);
export const playerProgressState = atom<number | null>(null);
export const playerReadyState = atom<number>(0);

void [
  i18next.t('ko', { ns: 'video' }),
  i18next.t('en', { ns: 'video' }),
  i18next.t('video', { ns: 'video' }),
  i18next.t('short', { ns: 'video' }),
  i18next.t('playlist', { ns: 'video' }),
];
