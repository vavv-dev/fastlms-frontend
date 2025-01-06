import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

import i18next from '@/i18n';

export { Card as AssetCard } from './Card';
export { Displays as AssetDisplays } from './Displays';
export { View as AssetView } from './View';
export { ViewDialog as AssetViewDialog } from './ViewDialog';

export const pageFamily = atomFamily(() => atom<string | number>(0));

void [i18next.t('html', { ns: 'asset' }), i18next.t('pdf', { ns: 'asset' }), i18next.t('epub', { ns: 'asset' })];
