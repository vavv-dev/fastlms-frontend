import {
  AssetDisplayResponse as DisplayResponse,
  assetGetDisplays as getDisplays,
  assetUpdateResource as updateResource,
} from '@/api';
import { ResourceCard, updateInfiniteCache, uppyFamily } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { formatDuration, formatRelativeTime, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';
import { CloudUpload, CloudUploadOutlined } from '@mui/icons-material';
import { Box, BoxProps, Button, Typography, useTheme } from '@mui/material';
import { useUppyEvent, useUppyState } from '@uppy/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';
import { UploadDialog } from './UploadDialog';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  sx?: BoxProps['sx'];
  showDescription?: boolean;
}

export const Card = ({ data, hideAvatar, sx, showDescription }: Props) => {
  const { t } = useTranslation('asset');
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useAtomValue(userState);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [uploaderOpen, setUploaderOpen] = useState(false);

  const uppy = useAtomValue(uppyFamily(data.id));
  const totalProgress = useUppyState(uppy, (state) => state.totalProgress);

  useUppyEvent(uppy, 'complete', () => {
    updateResource({
      id: data.id,
      requestBody: { uploaded: true },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: data.id, uploaded: true }, 'update');
    });
  });

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => {
          if (data.uploaded) navigate('.', { state: { dialog: data } });
          else setSnackbarMessage({ message: t('Asset is not uploaded yet'), duration: 3000 });
        }}
        banner={
          <>
            <Box
              component="img"
              alt={data.title}
              src={data.thumbnail}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '16 / 9' }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                px: '6px',
                borderRadius: '4px',
                fontWeight: '600',
                zIndex: 2,
                color: theme.palette.common.white,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {formatDuration(data.duration)}
            </Typography>
          </>
        }
        score={data.progress}
        passed={data.passed}
        avatarChildren={[
          t(...formatRelativeTime(data.modified)),
          user && user.username == data.owner.username && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setUploaderOpen(true);
              }}
            >
              {data.uploaded ? <CloudUpload color="primary" fontSize="small" /> : <CloudUploadOutlined fontSize="small" />}
              {totalProgress > 0 && `${toFixedHuman(totalProgress, 1)}%`}
            </Box>
          ),
        ]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        sx={sx}
        showDescription={showDescription}
        partialUpdateService={updateResource}
        listService={getDisplays}
        footer={
          data.progress !== null && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate('.', { state: { dialog: { question: true, ...data } } });
              }}
              sx={{ minWidth: 0, alignSelf: 'flex-start', py: 0 }}
            >
              {t('Q&A')}
            </Button>
          )
        }
      />
      {uploaderOpen && <UploadDialog open={uploaderOpen} setOpen={setUploaderOpen} id={data.id} />}
    </>
  );
};
