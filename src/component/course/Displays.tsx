import { AddOutlined, CloudUploadOutlined, School } from '@mui/icons-material';
import {
  Box,
  Input,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from './Card';
import { SaveDialog } from './SaveDialog';

import {
  CourseDisplayResponse as DisplayResponse,
  CourseGetDisplaysData as GetDisplaysData,
  courseCreateEsimsaCourse as createEsimsaCourse,
  courseGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, updateInfiniteCache } from '@/component/common';

export const Displays = () => {
  const { t } = useTranslation('course');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="course"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={CreateOptions}
      apiService={getDisplays}
      renderItem={({ data }) =>
        data?.map((pagination) => pagination.items?.map((item) => <Card key={item.id} data={item} hideAvatar />))
      }
      emptyMessage={<EmptyMessage Icon={School} message={t('No course found.')} />}
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

const CreateOptions = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  const { t } = useTranslation('course');
  const theme = useTheme();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fileError, setFileError] = useState<string>('');

  const showFileError = (message: string) => {
    setFileError(message);
    setTimeout(() => setFileError(''), 3000);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  useEffect(() => {
    setAnchorEl(open ? containerRef.current : null);
  }, [open]);

  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      e.target.value = '';
      showFileError(t('File size must be less than {{ max }} MB.', { max: 3 }));
      return;
    }
    createEsimsaCourse({
      formData: { file },
    })
      .then((created: DisplayResponse) => {
        updateInfiniteCache<DisplayResponse>(getDisplays, created, 'create');
      })
      .catch((error) => showFileError(error.message));
  };

  return (
    <>
      <Box
        ref={(node: HTMLDivElement | null) => {
          if (node) containerRef.current = node.parentElement as HTMLDivElement;
        }}
      >
        {fileError && (
          <Typography
            variant="caption"
            sx={{ color: 'error.main', position: 'absolute', bottom: '1em', width: '100%', textAlign: 'center' }}
          >
            {fileError}
          </Typography>
        )}
        <Input
          onChange={uploadFile}
          inputProps={{ accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }}
          id="upload-file"
          type="file"
          sx={{ display: 'none' }}
        />
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClick={handleClose}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
          sx={{ '& .MuiMenu-list': { p: 0 }, '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
        >
          <MenuList dense>
            <MenuItem onClick={() => {}}>
              <ListItemIcon>
                <CloudUploadOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <InputLabel sx={{ all: 'inherit' }} htmlFor="upload-file">
                  {t('Import esimsa course file')}
                </InputLabel>
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <AddOutlined />
              </ListItemIcon>
              <ListItemText>{t('Create new course')}</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} />}
    </>
  );
};
