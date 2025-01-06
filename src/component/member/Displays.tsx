import { FileDownloadOutlined, FileUploadOutlined, PersonAddAlt1, PersonAddAltOutlined } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from './ActionMenus';
import { BulkActions } from './BulkActions';
import { SaveDialog } from './SaveDialog';
import { XlsxUploadDialog } from './XlsxUploadDialog';

import {
  MemberDisplayResponse as DisplayResponse,
  MemberGetDisplaysData as GetDisplaysData,
  MemberGetDisplaysResponse as GetDisplaysResponse,
  memberDownloadMemberXlsxTemplate as downloadMemberXlsxTemplate,
  memberGetDisplays as getDisplays,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, calculateReverseIndex, formatDatetimeLocale } from '@/helper/util';
import { channelState } from '@/store';

export const Displays = () => {
  const { t } = useTranslation('member');
  const channel = useAtomValue(channelState);

  if (!channel) return null;

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="member"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'name', label: t('Name asc') },
      ]}
      CreateItemComponent={CreateOptions}
      apiService={getDisplays}
      renderItem={({ data }) => <MemberTable data={data} />}
      emptyMessage={<EmptyMessage Icon={PersonAddAlt1} message={t('No member yet.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
    />
  );
};

interface MemberTableProps {
  data: GetDisplaysResponse[] | undefined;
}

const MemberTable = ({ data }: MemberTableProps) => {
  const { t } = useTranslation('member');
  const channel = useAtomValue(channelState);
  const [selection, setSelection] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const selectable = data?.flatMap((pagination) => pagination.items.map((item) => item.id)).length || 0;

  const handleSelectRow = useCallback((id: string) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  }, []);

  useEffect(() => {
    if (!data) return;
    setSelectAll(selection.length === selectable);
  }, [selectable, selection.length, data]);

  useEffect(() => {
    // revalidate selection when data changes
    setSelection((prev) =>
      prev.filter((id) => data?.flatMap((pagination) => pagination.items.map((item) => item.id)).includes(id)),
    );
  }, [data]);

  if (!channel) return null;

  return (
    <Box sx={{ position: 'relative', display: 'inherit' }}>
      {selection.length !== 0 && <BulkActions selection={selection} setSelection={setSelection} data={data} />}
      <TableContainer>
        <Table
          sx={{
            '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' },
            '& th:last-of-type, td:last-of-type': { width: '2em' },
            '& td, th': { px: 0.5, py: 1 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectAll}
                  onChange={() => {
                    setSelectAll(!selectAll);
                    if (selectAll) setSelection([]);
                    else setSelection(data?.flatMap((pagination) => pagination.items.map((item) => item.id)) || []);
                  }}
                />
              </TableCell>
              <TableCell>no</TableCell>
              {channel.member_fields.map((field) => (
                <TableCell key={field}>{t(field)}</TableCell>
              ))}
              <TableCell>{t('Extra Data')}</TableCell>
              <TableCell>{t('Memo')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((pagination, pageIndex) =>
              pagination.items?.map((item, rowIndex) => (
                <MemberRow
                  data={item}
                  index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)}
                  key={item.id}
                  selected={selection.includes(item.id)}
                  onSelectRow={handleSelectRow}
                />
              )),
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

interface MemberRowProps {
  data: DisplayResponse;
  index: number;
  selected: boolean;
  onSelectRow: (id: string) => void;
}

const MemberRow = memo<MemberRowProps>(({ data, index, selected, onSelectRow }: MemberRowProps) => {
  const { t } = useTranslation('member');
  const theme = useTheme();
  const channel = useAtomValue(channelState);

  const renderField = useMemo(
    () => (field: string) => {
      if (field === 'username') return data.username;
      if (field === 'name' && data.joined_at) return <WithAvatar variant="small" {...data} />;
      if (field === 'email' && data.invited_at)
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {data.email}
            <Typography variant="caption">
              {t('Invited at {{ when }}', { when: formatDatetimeLocale(data.invited_at) })}
            </Typography>
          </Box>
        );

      return data.data[field];
    },
    [data, t],
  );

  if (!channel) return null;

  return (
    <TableRow
      onClick={() => onSelectRow(data.id)}
      sx={{ cursor: 'pointer', bgcolor: !data.joined_at ? theme.palette.action.hover : 'inherit' }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={selected} />
      </TableCell>
      <TableCell>{index}</TableCell>
      {channel.member_fields.map((field) => (
        <TableCell key={field}>{renderField(field)}</TableCell>
      ))}
      <TableCell sx={{ whiteSpace: 'pre-wrap !important', fontSize: '0.8em' }}>
        {Object.entries(data.data)
          .filter(([key]) => !channel.member_fields.includes(key))
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')}
      </TableCell>
      <TableCell>{data.memo}</TableCell>
      <TableCell>
        <ActionMenu data={data} />
      </TableCell>
    </TableRow>
  );
});

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  refresh?: () => void;
}

const CreateOptions = ({ open, setOpen, refresh }: Props) => {
  const { t } = useTranslation('member');
  const theme = useTheme();
  const [xlsxUploadOpen, setXlsxUploadOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const downloadXlsxTemplate = async () => {
    const text = await downloadMemberXlsxTemplate();
    base64XlsxDownload(text, 'member_template.xlsx');
  };

  useEffect(() => {
    setAnchorEl(open ? containerRef.current : null);
  }, [open]);

  return (
    <>
      <Box
        ref={(node: HTMLDivElement | null) => {
          if (node) containerRef.current = node.parentElement as HTMLDivElement;
        }}
      >
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
          transformOrigin={{ vertical: 'center', horizontal: 'center' }}
          sx={{ '& .MuiMenu-list': { p: 0 }, '& .MuiPaper-root': { borderRadius: theme.shape.borderRadius / 2 } }}
        >
          <MenuList dense>
            <MenuItem onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <PersonAddAltOutlined />
              </ListItemIcon>
              <ListItemText>{t('Add member')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setXlsxUploadOpen(true)}>
              <ListItemIcon>
                <FileUploadOutlined />
              </ListItemIcon>
              <ListItemText>{t('Upload xlsx member file')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => downloadXlsxTemplate()}>
              <ListItemIcon>
                <FileDownloadOutlined />
              </ListItemIcon>
              <ListItemText>{t('Download xlsx tempalte')}</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
      {saveDialogOpen && <SaveDialog open={saveDialogOpen} setOpen={setSaveDialogOpen} />}
      {xlsxUploadOpen && <XlsxUploadDialog open={xlsxUploadOpen} setOpen={setXlsxUploadOpen} refresh={refresh} />}
    </>
  );
};
