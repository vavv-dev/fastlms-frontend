import { MoreHoriz, MoreVert, RateReviewOutlined } from '@mui/icons-material';
import { Box, Checkbox, SpeedDial, SpeedDialAction, SpeedDialIcon, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageDialog } from './MessageDialog';

import { MemberGetDisplaysResponse as GetDisplaysResponse } from '@/api';

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
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

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

  return (
    <Box sx={{ flexGrow: 1, position: 'absolute', py: 2, top: 0, left: '0.2em', zIndex: 1, transform: 'translateY(-100%)' }}>
      {selection.length > 0 && (
        <Typography variant="caption" sx={{ color: 'info.main' }}>
          {t('{{count}} member(s) selected.', { count: totalSelected ? total : selection.length })}
        </Typography>
      )}
      <Tooltip
        title={selection.length === 0 ? t('If you select members, you can use bulk actions.') : ''}
        placement="bottom-start"
      >
        <span>
          <SpeedDial
            ariaLabel="Member bulk actions"
            icon={<SpeedDialIcon icon={<MoreVert />} openIcon={<MoreHoriz />} />}
            open={open}
            direction="right"
            FabProps={{
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
              icon={<RateReviewOutlined />}
              tooltipTitle={t('Send message')}
              onClick={() => setMessageDialogOpen((prev) => !prev)}
            />
          </SpeedDial>
        </span>
      </Tooltip>
      {messageDialogOpen && (
        <MessageDialog
          open={messageDialogOpen}
          setOpen={setMessageDialogOpen}
          selection={selection}
          totalSelected={totalSelected}
          total={total}
        />
      )}
    </Box>
  );
};
