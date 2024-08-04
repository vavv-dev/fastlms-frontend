import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { parseLocalStorage } from './helper/util';
import { UserResponse } from './api';

export const userState = atomWithStorage<UserResponse | null>('user', parseLocalStorage('user', null));
export const homeUserState = atom<UserResponse | null>(null);
export const accountProcessingState = atom<boolean>(false);
