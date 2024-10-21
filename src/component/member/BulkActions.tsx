import { MemberGetDisplaysResponse as GetDisplaysResponse } from '@/api';
import { searchFamily } from '@/component/common';
import {
  CloseOutlined,
  FileDownloadOutlined,
  MarkUnreadChatAltOutlined,
  MoreHoriz,
  MoreVert,
  SendOutlined,
} from '@mui/icons-material';
import { Box, Checkbox, SpeedDial, SpeedDialAction, SpeedDialIcon, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  selection: string[];
  setSelection: (selection: string[]) => void;
  data: GetDisplaysResponse[] | undefined;
}

export const BulkActions = ({ selection, setSelection, data }: Props) => {
  const { t } = useTranslation('member');
  const [open, setOpen] = useState(false);
  const [totalSelected, setTotalSelected] = useState(false);
  const total = data?.[0]?.total || 0;
  const selectable = data?.flatMap((pagination) => pagination.items.map((item) => item.id)).length || 0;

  // TODO when totalSelected is true, use this to select all
  const search = useAtomValue(searchFamily('member'));
  void search;

  useEffect(() => {
    if (selectable > selection.length) setTotalSelected(false);
  }, [selection.length, selectable]);

  useEffect(() => {
    setOpen(!!selection.length);
  }, [selection.length]);

  const selectTotal = () => {
    if (!data) return;
    if (totalSelected) {
      setTotalSelected(false);
    } else {
      setTotalSelected(true);
      if (selectable > selection.length) {
        setSelection(data.flatMap((pagination) => pagination.items.map((item) => item.id)));
      }
    }
  };

  const downloadMemberlist = () => {
    // TODO
  };

  const sendMessage = () => {
    // TODO
  };

  const invite = () => {
    // TODO
  };

  return (
    <Box sx={{ flexGrow: 1, position: 'absolute', py: 2, top: 0, left: '0.2em', zIndex: 1, transform: 'translateY(-100%)' }}>
      {selection.length > 0 && (
        <Typography variant="caption" sx={{ color: 'info.main' }}>
          {t('{{count}} member(s) selected.', { count: totalSelected ? total : selection.length })}
        </Typography>
      )}
      <SpeedDial
        ariaLabel="Member bulk actions"
        icon={<SpeedDialIcon icon={<MoreVert />} openIcon={<MoreHoriz />} />}
        open={open}
        direction="right"
        FabProps={{
          disabled: selection.length === 0,
          onClick: () => setOpen(!open),
          sx: { width: 48, height: 48, bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } },
        }}
      >
        {total > selectable && (
          <SpeedDialAction
            icon={<Checkbox checked={totalSelected} onClick={selectTotal} />}
            tooltipTitle={t('Select all searched {{ count }} members', { count: total })}
            tooltipPlacement="bottom"
          />
        )}
        <SpeedDialAction
          tooltipPlacement="bottom"
          icon={<MarkUnreadChatAltOutlined />}
          tooltipTitle={t('Send message')}
          onClick={sendMessage}
        />
        <SpeedDialAction
          tooltipPlacement="bottom"
          icon={<SendOutlined />}
          tooltipTitle={t('Send invitation')}
          onClick={invite}
        />
        <SpeedDialAction
          tooltipPlacement="bottom"
          icon={<FileDownloadOutlined />}
          tooltipTitle={t('Download xlsx file')}
          onClick={downloadMemberlist}
        />
        <SpeedDialAction tooltipPlacement="bottom" icon={<CloseOutlined />} tooltipTitle={t('Delete members')} />
      </SpeedDial>
    </Box>
  );
};
