import { atom } from 'jotai';

import { UserMessageResponse } from '@/api';

export { NotificationButton } from './NotificationButton';
export { Setting as NotificationSetting } from './Setting';
export { UserNotification } from './UserNotification';

export const notificationsState = atom<Array<UserMessageResponse>>([]);
