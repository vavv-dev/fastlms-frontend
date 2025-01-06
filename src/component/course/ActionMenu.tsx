import { ListAltOutlined, PersonAddOutlined, PersonRemoveOutlined, SchoolOutlined } from '@mui/icons-material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { ListItemIcon, MenuItem } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EnrollDialog } from './EnrollDialog';
import { ReportDialog } from './ReportDialog';
import { SaveDialog } from './SaveDialog';
import { UnenrollDialog } from './UnenrollDialog';

import {
  CourseDisplayResponse as DisplayResponse,
  courseDeleteResource as deleteResource,
  courseGetDisplays as getDisplays,
  courseToggleAction as toggleAction,
} from '@/api';
import { DeleteResourceDialog, ResourceActionMenu, createToggleAction } from '@/component/common';
import { userState } from '@/store';

export const ActionMenu = ({ data }: { data: DisplayResponse }) => {
  const { t } = useTranslation('course');
  const user = useAtomValue(userState);
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const action = createToggleAction<DisplayResponse>(toggleAction, getDisplays);

  if (!user) return null;

  return (
    <>
      <ResourceActionMenu
        menuItems={[
          <MenuItem key="bookmark" onClick={() => action('bookmark', data)}>
            <ListItemIcon>{data.bookmarked ? <BookmarkRemoveOutlinedIcon /> : <BookmarkAddOutlinedIcon />}</ListItemIcon>
            {data.bookmarked ? t('Remove bookmark') : t('Add bookmark')}
          </MenuItem>,

          <MenuItem
            key="enroll"
            onClick={() => {
              if (data.enrolled) setUnenrollDialogOpen(true);
              else setEnrollDialogOpen(true);
            }}
          >
            <ListItemIcon>{data.enrolled ? <PersonRemoveOutlined /> : <PersonAddOutlined />}</ListItemIcon>
            {data.enrolled ? t('Unenroll') : t('Enroll')}
          </MenuItem>,

          <MenuItem key="courseinfo" onClick={() => navigate(`/course/${data.id}/outline`)}>
            <ListItemIcon>
              <SchoolOutlined />
            </ListItemIcon>
            {t('View course info')}
          </MenuItem>,

          user.username === data?.owner.username && [
            <MenuItem key="enrollment-list" onClick={() => setReportDialogOpen(true)}>
              <ListItemIcon>
                <ListAltOutlined />
              </ListItemIcon>
              {t('Enrollment list')}
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
          title=""
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          resourceId={data.id}
          destroyService={deleteResource}
          listService={getDisplays}
        />
      )}
      {enrollDialogOpen && <EnrollDialog open={enrollDialogOpen} setOpen={setEnrollDialogOpen} id={data.id} />}
      {unenrollDialogOpen && <UnenrollDialog open={unenrollDialogOpen} setOpen={setUnenrollDialogOpen} id={data.id} />}
      {reportDialogOpen && <ReportDialog open={reportDialogOpen} setOpen={setReportDialogOpen} data={data} />}
    </>
  );
};
