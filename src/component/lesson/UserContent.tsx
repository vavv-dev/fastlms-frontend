import { ContentDisplayResponse, ContentGetDisplaysData, contentGetDisplays, contentUpdateResource2 } from '@/api';
import { GridInfiniteScrollPage, updateInfiniteCache } from '@/component/common';
import { formatDatetimeLocale, formatDuration, toFixedHuman } from '@/helper/util';
import { homeUserState, userState } from '@/store';
import { AddOutlined, CloudUpload, CloudUploadOutlined } from '@mui/icons-material';
import { Box, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useUppyEvent, useUppyState } from '@uppy/react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { uppyFamily } from '.';
import ContentActionMenu from './ContentActionMenu';
import ContentUploaderDialog from './ContentUploaderDialog';
import ContentViewDialog from './ContentViewDialog';
import SaveContentDialog from './SaveContentDialog';

const UserContent = () => {
  const { t } = useTranslation('lesson');
  const user = useAtomValue(userState);
  const homeUser = useAtomValue(homeUserState);
  const owner = user && user.id == homeUser?.id;
  const [contentDialogOpen, setContentDialogOpen] = useState(false);

  // redirect 401
  if (!user || user.username !== homeUser?.username) return <Navigate to="/error/401" replace />;

  return (
    <>
      <GridInfiniteScrollPage<ContentDisplayResponse, ContentGetDisplaysData>
        pageKey="content"
        orderingOptions={[
          { value: 'modified', label: t('Modified desc') },
          { value: 'title', label: t('Title asc') },
        ]}
        apiService={contentGetDisplays}
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
                {data?.map((pagination) =>
                  pagination.items?.map((content, i) => (
                    <ContentRow
                      content={content}
                      line={pagination.total - (pagination.page - 1) * pagination.size - i}
                      key={content.id}
                    />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        gridBoxSx={{ gap: '1em 1em', gridTemplateColumns: '1fr' }}
        extraAction={(tab) =>
          tab == 'owner' &&
          owner && <Chip onClick={() => setContentDialogOpen(true)} icon={<AddOutlined />} label={t('Create content')} />
        }
      />
      {contentDialogOpen && <SaveContentDialog open={contentDialogOpen} setOpen={setContentDialogOpen} />}
    </>
  );
};

export default UserContent;

const ContentRow = ({ content, line }: { content: ContentDisplayResponse; line: number }) => {
  const { t } = useTranslation('lesson');
  const [contentViewDialogOpen, setContentViewDialogOpen] = useState(false);

  return (
    <TableRow
      onClick={() => setContentViewDialogOpen(true)}
      key={content.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{line}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: 600 }}>
          {content.thumbnail && (
            <Box
              component="img"
              src={content.thumbnail}
              sx={{ aspectRatio: '16/9', objectFit: 'cover', width: '80px', borderRadius: 1 }}
            />
          )}
          {content.title}
        </Box>
      </TableCell>
      <TableCell>{!content.is_public && t('Not public')}</TableCell>
      <TableCell>{formatDuration(content.duration)}</TableCell>
      <TableCell>{toFixedHuman(content.passing_percent, 1)}</TableCell>
      <TableCell>{formatDatetimeLocale(content.modified)}</TableCell>
      <TableCell>
        <ContentUpload content={content} />
      </TableCell>
      <TableCell>
        <ContentActionMenu content={content} />
      </TableCell>
      {contentViewDialogOpen && (
        <ContentViewDialog open={contentViewDialogOpen} setOpen={setContentViewDialogOpen} contentId={content.id} />
      )}
    </TableRow>
  );
};
const ContentUpload = ({ content }: { content: ContentDisplayResponse }) => {
  const [contentUploaderOpen, setContentUploaderOpen] = useState(false);
  const uppy = useAtomValue(uppyFamily(content.id));
  const totalProgress = useUppyState(uppy, (state) => state.totalProgress);

  useUppyEvent(uppy, 'complete', () => {
    contentUpdateResource2({
      id: content.id,
      requestBody: { uploaded: true },
    }).then(() => {
      updateInfiniteCache<ContentDisplayResponse>(contentGetDisplays, { id: content.id, uploaded: true }, 'update');
    });
  });

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: '80px' }}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setContentUploaderOpen(true);
          }}
        >
          {content.uploaded ? <CloudUpload color="primary" /> : <CloudUploadOutlined />}
        </IconButton>

        {totalProgress > 0 && `${toFixedHuman(totalProgress, 1)}%`}
      </Box>
      {contentUploaderOpen && (
        <ContentUploaderDialog open={contentUploaderOpen} setOpen={setContentUploaderOpen} contentId={content.id} />
      )}
    </>
  );
};
