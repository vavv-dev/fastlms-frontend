import { FilterOutlined } from '@mui/icons-material';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from './ActionMenu';
import { DesignerDialog } from './DesignerDialog';

import {
  TemplateDisplayResponse as DisplayResponse,
  certificateGetDisplays as getDisplays,
  CertificateGetDisplaysData as GetDisplaysData,
  TemplateDisplayResponse,
} from '@/api';
import { EmptyMessage, GridInfiniteScrollPage } from '@/component/common';
import { calculateReverseIndex, formatDatetimeLocale, textEllipsisCss } from '@/helper/util';

export const Displays = () => {
  const { t } = useTranslation('certificate');

  return (
    <GridInfiniteScrollPage<DisplayResponse, GetDisplaysData>
      pageKey="template"
      orderingOptions={[{ value: 'modified', label: t('Recently modified') }]}
      CreateItemComponent={DesignerDialog}
      apiService={getDisplays}
      renderItem={({ data }) =>
        !!data?.[0]?.total && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">no</TableCell>
                  <TableCell align="center">{t('Title')}</TableCell>
                  <TableCell align="center">{t('Modified')}</TableCell>
                  <TableCell sx={{ width: '3em' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.map((pagination, pageIndex) =>
                  pagination.items?.map((row, rowIndex) => (
                    <TemplateRow
                      row={row}
                      index={calculateReverseIndex(data, pageIndex, rowIndex, pagination.total)}
                      key={row.id}
                    />
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      }
      emptyMessage={<EmptyMessage Icon={FilterOutlined} message={t('No template found.')} />}
      gridBoxSx={{ gap: '2em 1em', gridTemplateColumns: '1fr', '& .create-resource-button': { maxHeight: '200px' } }}
      boxPadding={0}
    />
  );
};

const TemplateRow = ({ row, index }: { row: TemplateDisplayResponse; index: number }) => {
  const [designerOpen, setDesignerOpen] = useState(false);

  return (
    <TableRow
      onClick={() => setDesignerOpen(true)}
      key={row.id}
      sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
    >
      <TableCell align="center">{index}</TableCell>
      <TableCell sx={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            backgroundImage: `url(${row.thumbnail})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100px',
            minWidth: '100px',
            aspectRatio: '1/ 1',
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Typography variant="body2" sx={{ ...textEllipsisCss(1), whiteSpace: 'wrap' }}>
            {row.title}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">{formatDatetimeLocale(row.modified)}</TableCell>
      <TableCell>
        <ActionMenu data={row} />
      </TableCell>
      {designerOpen && <DesignerDialog open={designerOpen} setOpen={setDesignerOpen} id={row.id} />}
    </TableRow>
  );
};
