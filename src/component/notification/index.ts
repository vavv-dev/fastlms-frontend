import { atom } from 'jotai';

import { UserMessageResponse } from '@/api';

export { UserNotification } from './UserNotification';
export { NotificationButton } from './NotificationButton';

export const notificationsState = atom<Array<UserMessageResponse>>([]);
