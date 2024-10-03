import {
  MemberDisplayResponse as DisplayResponse,
  MemberGetDisplaysData as GetDisplaysData,
  memberDownloadMemberXlsxTemplate as downloadMemberXlsxTemplate,
  memberGetDisplays as getDisplays,
} from '@/api';
import { GridInfiniteScrollPage, WithAvatar } from '@/component/common';
import { base64XlsxDownload, calculateReverseIndex, formatDatetimeLocale } from '@/helper/util';
import { FileDownloadOutlined, FileUploadOutlined, PersonAddAltOutlined } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { atom, useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenus';
import { ListActions } from './ListActions';
import { SaveDialog } from './SaveDialog';
import { XlsxUploadDialog } from './XlsxUploadDialog';

const rosterOnlyState = atom(false);

export const Displays = () => {
  const { t } = useTranslation('member');
  const [rosterOnly, setRosterOnly] = useAtom(rosterOnlyState);
  const [selection, setSelection] = useState<number[]>([]);

  // const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   // if (event.target.checked) {
  //   //   const allIds = data?.flatMap((pagination) => pagination.items?.map((item) => item.id.toString()) ?? []) ?? [];
  //   //   setSelection(allIds);
  //   // } else {
  //   //   setSelection([]);
  //   // }
  // };

  const handleSelectRow = (id: number) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  // const handleBulkAction = () => {
  //   console.log('Bulk action on:', selection);
  //   // Implement your bulk action logic here
  // };

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="account"
      orderingOptions={[
        { value: 'created', label: t('Recently created') },
        { value: 'name', label: t('Name asc') },
      ]}
      CreateItemComponent={CreateOptions}
      apiService={getDisplays}
      apiOptions={{ roster: rosterOnly }}
      renderItem={({ data }) =>
        (data?.[0].total as number) > 0 && (
          <TableContainer>
            <Table
              sx={{
                '& th,td:not(:nth-of-type(3))': { whiteSpace: 'nowrap' },
                '& th:last-of-type, td:last-of-type': { width: '2em' },
                '& td': { py: 1 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <ListActions selection={selection} totalCount={data?.[0].total} />
                  </TableCell>
                  <TableCell>no</TableCell>
                  <TableCell>{t('Username')}</TableCell>
                  <TableCell>{t('Member data')}</TableCell>
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
        )
      }
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      extraAction={
        <FormControlLabel
          control={<Switch checked={rosterOnly} onChange={() => setRosterOnly(!rosterOnly)} />}
          label={<Typography variant="subtitle2">{t('Roster only')}</Typography>}
        />
      }
    />
  );
};

interface MemberRowProps {
  data: DisplayResponse;
  index: number;
  selected: boolean;
  onSelectRow: (id: number) => void;
}

const MemberRow = ({ data, index, selected, onSelectRow }: MemberRowProps) => {
  const theme = useTheme();
  const { t } = useTranslation('member');

  return (
    <TableRow sx={{ bgcolor: data.id < 0 ? theme.palette.action.hover : 'inherit' }}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={() => onSelectRow(data.id)} />
      </TableCell>
      <TableCell>{index}</TableCell>
      <TableCell sx={{ pointerEvents: data.id < 0 ? 'none' : 'auto' }}>
        <WithAvatar {...data} variant="small">
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="caption">{data.username}</Typography>
            {data.invited_at && (
              <Typography variant="caption" color="warning">
                {t('Invited at {{ when }}', { when: formatDatetimeLocale(data.invited_at) })}
              </Typography>
            )}
          </Box>
        </WithAvatar>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'pre-wrap !important', fontSize: '0.8em' }}>
        {Object.entries(data.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')}
      </TableCell>
      <TableCell>{data.memo}</TableCell>
      <TableCell>
        <ActionMenu data={data} />
      </TableCell>
    </TableRow>
  );
};

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
