import { ListAltOutlined, RemoveOutlined } from '@mui/icons-material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSWRConfig } from 'swr';

import { ReportDialog } from './ReportDialog';
import { SaveDialog } from './SaveDialog';

import {
  ExamDisplayResponse as DisplayResponse,
  examDeleteAttempt as deleteAttempt,
  examDeleteResource as deleteResource,
  examGetAttempt as getAttempt,
  examGetDisplays as getDisplays,
  examToggleAction as toggleAction,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu, createToggleAction, updateInfiniteCache } from '@/component/common';
import { userState } from '@/store';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('exam');
  const user = useAtomValue(userState);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays);

  const cancelSubmit = () => {
    // for test
    deleteAttempt({
      id: data.id,
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(
        getDisplays,
        { ...data, status: null, score: null, passed: null, context: null },
        'update',
      );
      // delete cache
      mutate(
        (key) => {
          if (!key || typeof key !== 'string') return false;
          // !caution: Must exlcude this function from minifying process
          const r = new RegExp(`${getAttempt.name}/.+${data.id}`);
          return r.test(key);
        },
        undefined,
        { revalidate: false },
      );
    });
  };

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => action('bookmark', data)}>
            <ListItemIcon>{data.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {data.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          data.status && (
            <MenuItem key="cancel-submit" onClick={cancelSubmit}>
              <ListItemIcon>
                <RemoveOutlined />
              </ListItemIcon>
              {t('Cancel submission')}
            </MenuItem>
          ),

          user.username === data?.owner.username && [
            <MenuItem key="submission-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Submission list')}
            </MenuItem>,
            <MenuItem key="save" onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <EditOutlinedIcon />
              </ListItemIcon>
              {t('Edit')}
            </MenuItem>,
            <MenuItem key="delete" onClick={() => setDeleteDialogOpen(true)}>
              <ListItemIcon>
                <RemoveCircleOutlineOutlinedIcon />
              </ListItemIcon>
              {t('Delete')}
            </MenuItem>,
          ],
        ].flat()}
      />

      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} id={data.id} />}
      {deleteDialogOpen && (
        <DeleteResourceDialog
          title={t('Exam')}
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          resourceId={data.id}
          destroyService={deleteResource}
          listService={getDisplays}
        />
      )}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} data={data} />}
    </>
  );
};
