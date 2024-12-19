import { CloudUploadOutlined, PlaylistAddOutlined, PlaylistPlay } from '@mui/icons-material';
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ImportYoutubeDialog } from '../ImportYoutubeDialog';
import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  PlaylistDisplayResponse as DisplayResponse,
  playlistGetDisplays as getDisplays,
  PlaylistGetDisplaysData as GetDisplaysData,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';

export const Displays = () => {
  const { t } = useTranslation('video');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="playlist"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={CreateOptions}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      emptyMessage={<EmptyMessage Icon={PlaylistPlay} message={t('No playlist found.')} />}
      gridBoxSx={{
        gap: '2em 4px',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          mobile: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 210px)',
        },
      }}
    />
  );
};

const CreateOptions = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const [youtubeImportOpen, setYoutubeImportOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAnchorEl(open ? containerRef.current : null);
  }, [open]);

  return (
    <>
      <Box
        ref={(node: HTMLDivElement | null) => {
          if (node) containerRef.current = node.parentElement as HTMLDivElement;
        }}
      >
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
          sx={{ '& .MuiMenu-list': { p: 0 }, '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
        >
          <MenuList dense>
            <MenuItem onClick={() => setYoutubeImportOpen(true)}>
              <ListItemIcon>
                <CloudUploadOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('Import youtube playlist')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <PlaylistAddOutlined />
              </ListItemIcon>
              <ListItemText>{t('Create new playlist')}</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
      {youtubeImportOpen && <ImportYoutubeDialog open={youtubeImportOpen} setOpen={setYoutubeImportOpen} kind="playlist" />}
      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} />}
    </>
  );
};
