import { CloudUpload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  AssetDisplayResponse as DisplayResponse,
  assetGetDisplays as getDisplays,
  AssetGetDisplaysData as GetDisplaysData,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';

export const Displays = () => {
  const { t } = useTranslation('asset');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="asset"
      orderingOptions={[
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={SaveDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      emptyMessage={<EmptyMessage Icon={CloudUpload} message={t('No asset found.')} />}
      gridBoxSx={{
        gap: '2em 1em',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          mobile: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 251px)',
          lg: 'repeat(4, minmax(251px, 308px))',
        },
      }}
    />
  );
};
