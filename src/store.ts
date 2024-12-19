import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { ChannelDisplayResponse, UserResponse } from './api';
import { parseLocalStorage } from './helper/util';

export const loginExpireState = atomWithStorage<string | null>('loginExpire', parseLocalStorage('loginExpire', null));
export const userState = atomWithStorage<UserResponse | null>('user', parseLocalStorage('user', null));
export const channelState = atom<ChannelDisplayResponse | null>(null);
export const userMessageState = atom<WebSocket | null>(null);
export const invitationUrl = `${window.location.origin}/invitation-accept`;
