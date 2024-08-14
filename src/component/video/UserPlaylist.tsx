import { PlaylistDisplayResponse, playlistGetDisplay, PlaylistGetDisplayData } from '@/api';
import { GridInfiniteScrollPage } from '@/component/common';
import { CloudDownloadOutlined, PlaylistAddOutlined } from '@mui/icons-material';
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImportYoutubeDialog from './coms/ImportYoutubeDialog';
import PlaylistCard from './PlaylistCard';
import SavePlaylistDialog from './SavePlaylistDialog';

const UserPlaylist = () => {
  const { t } = useTranslation('video');
  const sharedItemTabKey = 'bookmarker';

  return (
    <GridInfiniteScrollPage<PlaylistDisplayResponse, PlaylistGetDisplayData>
      pageKey="playlist"
      tabConfig={{
        sharedItemTabKey,
        sharedItemTabLabel: t('Playlist I bookmarked'),
        ownedItemTabLabel: t('My playlist'),
      }}
      orderingOptions={[
        { value: 'modified', label: t('Recently modified') },
        { value: 'title', label: t('Title asc') },
      ]}
      CreateItemComponent={CreateOptions}
      apiService={playlistGetDisplay}
      renderItem={({ data, tab }) =>
        data?.map((pagination) =>
          pagination.items?.map((item) => <PlaylistCard key={item.id} playlist={item} hideAvatar={tab != sharedItemTabKey} />),
        )
      }
      gridBoxSx={{
        gap: '2em 4px',
        gridTemplateColumns: {
          xs: 'repeat(1, 344px)',
          sm: 'repeat(auto-fill, 210px)',
        },
      }}
    />
  );
};

export default UserPlaylist;

const CreateOptions = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void; onSuccess?: () => void }) => {
  const { t } = useTranslation('video');
  const theme = useTheme();
  const [youtubeImportOpen, setYoutubeImportOpen] = useState(false);
  const [saveMediaDialogOpen, setSaveMediaDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  useEffect(() => {
    setAnchorEl(open ? containerRef.current : null);
  }, [open]);

  return (
    <>
      <Box onClick={(e) => e.stopPropagation()} ref={containerRef}>
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClick={handleClose}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
          sx={{ '& .MuiMenu-list': { p: 0 }, '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
        >
          <MenuList dense>
            <MenuItem onClick={() => setYoutubeImportOpen(true)}>
              <ListItemIcon>
                <CloudDownloadOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('Import youtube playlist')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setSaveMediaDialogOpen(true)}>
              <ListItemIcon>
                <PlaylistAddOutlined />
              </ListItemIcon>
              <ListItemText>{t('Create new playlist')}</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
      {youtubeImportOpen && <ImportYoutubeDialog open={youtubeImportOpen} setOpen={setYoutubeImportOpen} kind={'playlist'} />}
      {saveMediaDialogOpen && <SavePlaylistDialog open={saveMediaDialogOpen} setOpen={setSaveMediaDialogOpen} />}
    </>
  );
};
