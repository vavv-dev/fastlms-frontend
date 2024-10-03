import {
  ContentDisplayResponse as DisplayResponse,
  contentGetDisplays as getDisplays,
  ContentGetDisplaysData as getDisplaysData,
  contentUpdateResource as updateResource,
} from '@/api';
import { GridInfiniteScrollPage, updateInfiniteCache, uppyFamily } from '@/component/common';
import { calculateReverseIndex, formatDatetimeLocale, formatDuration, toFixedHuman } from '@/helper/util';
import { homeUserState, userState } from '@/store';
import { AddOutlined, CloudUpload, CloudUploadOutlined } from '@mui/icons-material';
import { Box, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useUppyEvent, useUppyState } from '@uppy/react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { ActionMenu } from './ActionMenu';
import { SaveDialog } from './SaveDialog';
import { UploadDialog } from './UploadDialog';
import { ViewDialog } from './ViewDialog';

export const Displays = () => {
  const { t } = useTranslation('lesson');
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;
  const [DialogOpen, setDialogOpen] = useState(false);

  // redirect 401
  if (!user || user.username !== homeUser?.username) return <Navigate to="/error/401" replace />;

  return (
    <>
      <GridInfiniteScrollPage<DisplayResponse, getDisplaysData>
        pageKey="content"
        orderingOptions={[
          { value: 'modified', label: t('Modified desc') },
          { value: 'title', label: t('Title asc') },
        ]}
        apiService={getDisplays}
        renderItem={({ data }) => (
          <TableContainer>
            <Table sx={{ '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center">no</TableCell>
                  <TableCell>{t('Title')}</TableCell>
                  <TableCell>{t('Public')}</TableCell>
                  <TableCell>{t('Duration')}</TableCell>
                  <TableCell>{t('Passing %')}</TableCell>
                  <TableCell>{t('Modified')}</TableCell>
                  <TableCell>{t('Uploaded')}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((pagination, pageIndex) =>
                  pagination.items?.map((item, rowIndex) => (
                    <Row item={item} index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)} key={item.id} />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
        extraAction={() =>
          owner && <Chip onClick={() => setDialogOpen(true)} icon={<AddOutlined />} label={t('Create content')} />
        }
      />
      {DialogOpen && <SaveDialog open={DialogOpen} setOpen={setDialogOpen} />}
    </>
  );
};

const Row = ({ item, index }: { item: DisplayResponse; index: number }) => {
  const { t } = useTranslation('lesson');
  const [ViewDialogOpen, setViewDialogOpen] = useState(false);

  return (
    <TableRow
      onClick={() => setViewDialogOpen(true)}
      key={item.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: 600 }}>
          {item.thumbnail && (
            <Box
              component="img"
              src={item.thumbnail}
              sx={{ aspectRatio: '16/9', objectFit: 'cover', width: '80px', borderRadius: 1 }}
            />
          )}
          {item.title}
        </Box>
      </TableCell>
      <TableCell>{!item.is_public && t('Not public')}</TableCell>
      <TableCell>{formatDuration(item.duration)}</TableCell>
      <TableCell>{toFixedHuman(item.cutoff_progress, 1)}</TableCell>
      <TableCell>{formatDatetimeLocale(item.modified)}</TableCell>
      <TableCell>
        <Upload item={item} />
      </TableCell>
      <TableCell>
        <ActionMenu data={item} />
      </TableCell>
      {ViewDialogOpen && <ViewDialog open={ViewDialogOpen} setOpen={setViewDialogOpen} id={item.id} />}
    </TableRow>
  );
};
const Upload = ({ item }: { item: DisplayResponse }) => {
  const [UploaderOpen, setUploaderOpen] = useState(false);
  const uppy = useAtomValue(uppyFamily(item.id));
  const totalProgress = useUppyState(uppy, (state) => state.totalProgress);

  useUppyEvent(uppy, 'complete', () => {
    updateResource({
      id: item.id,
      requestBody: { uploaded: true },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: item.id, uploaded: true }, 'update');
    });
  });

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: '80px' }}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setUploaderOpen(true);
          }}
        >
          {item.uploaded ? <CloudUpload color="primary" /> : <CloudUploadOutlined />}
        </IconButton>
        {totalProgress > 0 && `${toFixedHuman(totalProgress, 1)}%`}
      </Box>
      {UploaderOpen && <UploadDialog open={UploaderOpen} setOpen={setUploaderOpen} id={item.id} />}
    </>
  );
};
