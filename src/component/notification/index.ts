import { UserMessageResponse } from '@/api';
import { atom } from 'jotai';

export { UserNotification } from './UserNotification';
export { NotificationButton } from './NotificationButton';

export const notificationsState = atom<Array<UserMessageResponse>>([]);
