import i18next from '@/i18n';
import { atom } from 'jotai';
import ReactPlayer from 'react-player/youtube';
import PlaylistView from './PlaylistView';
import UserPlaylist from './UserPlaylist';
import UserVideo from './UserVideo';
import VideoSearchResult from './VideoSearchResult';
import VideoView from './VideoView';
import SearchBox from './coms/SearchBox';

export { PlaylistView, SearchBox, UserPlaylist, UserVideo, VideoSearchResult, VideoView };

export const activeVideoIdState = atom<string | null>(null);
export const playerHeightState = atom<string>('');
export const playerInstanceState = atom<ReactPlayer | null>(null);
export const playerProgressState = atom<number | null>(null);
export const playerReadyState = atom<number>(0);

void [i18next.t('video', { ns: 'video' }), i18next.t('short', { ns: 'video' }), i18next.t('playlist', { ns: 'video' })];
