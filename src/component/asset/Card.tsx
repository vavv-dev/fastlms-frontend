import { CloudUpload, CloudUploadOutlined, Html, MenuBookOutlined, PictureAsPdf } from '@mui/icons-material';
import { Box, BoxProps, Tooltip, Typography, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from './ActionMenu';
import { ViewDialog } from './ViewDialog';

import {
  AssetDisplayResponse as DisplayResponse,
  assetGetDisplays as getDisplays,
  assetUpdateResource as updateResource,
} from '@/api';
import { ResourceCard, updateInfiniteCache } from '@/component/common';
import { snackbarMessageState } from '@/component/layout';
import { UploadDialog } from '@/component/uppy';
import { formatDuration, formatRelativeTime, toFixedHuman } from '@/helper/util';
import { userState } from '@/store';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  sx?: BoxProps['sx'];
  showDescription?: boolean;
}

export const Card = ({ data, hideAvatar, sx, showDescription }: Props) => {
  const { t } = useTranslation('asset');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const setSnackbarMessage = useSetAtom(snackbarMessageState);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewOpen, setViewOpen] = useState(false);

  const handleUploadComplete = () => {
    updateResource({
      id: data.id,
      requestBody: { uploaded: true },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: data.id, uploaded: true }, 'update');
    });
  };

  return (
    <>
      <ResourceCard
        resource={data}
        onClick={() => {
          if (data.uploaded) setViewOpen(true);
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
              {data.sub_kind == 'epub' ? (
                <Tooltip title="EPUB">
                  <MenuBookOutlined fontSize="small" />
                </Tooltip>
              ) : data.sub_kind == 'pdf' ? (
                <Tooltip title="PDF">
                  <PictureAsPdf fontSize="small" />
                </Tooltip>
              ) : data.sub_kind == 'html' ? (
                <Tooltip title="HTML">
                  <Html fontSize="small" sx={{ stroke: '#eee' }} />
                </Tooltip>
              ) : undefined}
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
              className="asset-upload"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setUploaderOpen(true);
              }}
            >
              {data.uploaded ? <CloudUpload color="primary" fontSize="small" /> : <CloudUploadOutlined fontSize="small" />}
              {uploadProgress > 0 && `${toFixedHuman(uploadProgress, 1)}%`}
            </Box>
          ),
        ]}
        hideAvatar={hideAvatar}
        actionMenu={<ActionMenu data={data} />}
        sx={sx}
        showDescription={showDescription}
      />
      {uploaderOpen && (
        <Suspense fallback={null}>
          <UploadDialog
            open={uploaderOpen}
            setOpen={setUploaderOpen}
            id={data.id}
            onProgress={setUploadProgress}
            onComplete={handleUploadComplete}
          />
        </Suspense>
      )}
      {viewOpen && <ViewDialog open={viewOpen} setOpen={setViewOpen} id={data.id} />}
    </>
  );
};
