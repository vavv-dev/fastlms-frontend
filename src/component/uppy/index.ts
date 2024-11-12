import { lazy } from 'react';

export { uppyFamily } from './uppy';

export const UploadDialog = lazy(() => import('./UploadDialog').then((module) => ({ default: module.UploadDialog })));
