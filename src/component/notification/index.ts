import { atom } from 'jotai';

import { UserMessageResponse } from '@/api';

export { NotificationBox } from './NotificationBox';
export { Setting as NotificationSetting } from './Setting';
export { UserNotification } from './UserNotification';

export const notificationsState = atom<Array<UserMessageResponse>>([]);
