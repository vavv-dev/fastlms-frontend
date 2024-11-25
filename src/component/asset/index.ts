import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export { Card as AssetCard } from './Card';
export { Displays as AssetDisplays } from './Displays';
export { View as AssetView } from './View';
export { ViewDialog as AssetViewDialog } from './ViewDialog';

export const pageFamily = atomFamily(() => atom<string | number>(0));
