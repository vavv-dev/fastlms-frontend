import { atom } from 'jotai';
import ReactPlayer from 'react-player/youtube';

import i18next from '@/i18n';

export { Card as VideoCard } from './Card';
export { Displays as VideoDisplays } from './Displays';
export { HomeVideo } from './HomeVideo';
export { Player as VideoPlayer } from './Player';
export { SimpleView as VideoSimpleView } from './SimpleView';
export { Tracking as VideoTracking } from './Tracking';
export { View as VideoView } from './View';
export { Card as PlaylistCard } from './playlist/Card';
export { Displays as PlaylistDisplays } from './playlist/Displays';
export { View as PlaylistView } from './playlist/View';
export { Input as SearchInput } from './search/Input';
export { Result as VideoSearchResult } from './search/Result';

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
