import { AddCircle, CheckBoxOutlineBlank, Refresh } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  PaperProps,
  Popper,
  PopperProps,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useServiceImmutable } from './hooks';

import { getRegExp } from '@/helper/search';

interface Props<T extends { id: string | number }, K extends object> {
  service: (params: object) => Promise<T[]>;
  serviceParams?: K;
  labelField: string;
  groupField?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder: string;
  multiple?: boolean;
  onSelect: (params: T[]) => void;
  selectionLimit?: number;
  excludes?: Set<string | number>;
}

export const AutocompleteSelect2 = <T extends { id: string | number }, K extends object>({
  service,
  serviceParams,
  labelField,
  groupField,
  open,
  setOpen,
  placeholder,
  multiple = true,
  onSelect,
  selectionLimit,
  excludes = new Set(),
}: Props<T, K>) => {
  const { t } = useTranslation('common');
  const [value, setValue] = useState<T[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { data, mutate } = useServiceImmutable<K, T[]>(service, serviceParams);

  const matcher = (v: string) => {
    const noSpace = v.replace(/\s/g, '');
    return getRegExp(noSpace, { ignoreSpace: true, ignoreCase: true, global: true });
  };

  return (
    <Dialog
      transitionDuration={0}
      scroll="body"
      PaperProps={{
        sx: {
          mt: '50px',
          verticalAlign: 'top',
          maxWidth: '800px',
          borderRadius: '8px',
        },
      }}
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
    >
      <DialogContent id="dialog-anchor" sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autocomplete
            size="small"
            multiple={multiple}
            getOptionDisabled={() => (selectionLimit ? (value.length >= selectionLimit ? true : false) : false)}
            value={value}
            onChange={(_, newValue) => setValue(newValue as T[])}
            inputValue={inputValue}
            onInputChange={(_, newInputValue, reason) => reason !== 'reset' && setInputValue(newInputValue)}
            freeSolo
            openOnFocus
            disableCloseOnSelect
            autoHighlight
            options={data ? data.filter((d) => !excludes.has(d.id)) : []}
            getOptionLabel={(option) => (option instanceof Object ? (option[labelField as keyof T] as string) : option)}
            renderInput={(params) => <TextField autoFocus placeholder={placeholder} {...params} />}
            renderOption={(props, option, { inputValue, selected }) => {
              const pattern = inputValue ? matcher(inputValue) : inputValue;
              let title = option[labelField as keyof T] as string;
              if (inputValue && title.match(pattern)) {
                title = title.replace(pattern, (matched: string) => `<mark>${matched}</mark>`);
              }
              return (
                <li {...props} key={option.id}>
                  <Box>
                    <Checkbox icon={<CheckBoxOutlineBlank />} checked={selected} />
                    {'thumbnail' in option && option.thumbnail ? (
                      <Box component="img" src={option.thumbnail as string} />
                    ) : (
                      <div />
                    )}
                    <Box dangerouslySetInnerHTML={{ __html: title }} />
                  </Box>
                </li>
              );
            }}
            filterOptions={(options, { inputValue }) => {
              const pattern = inputValue ? matcher(inputValue) : inputValue;
              return options.filter((option) => !inputValue || (option[labelField as keyof T] as string).match(pattern));
            }}
            renderTags={(tagValue, getTagProps) => {
              return tagValue.map((option, index) => (
                <Chip {...getTagProps({ index })} key={option.id} label={option[labelField as keyof T] as string} />
              ));
            }}
            PaperComponent={CustomPaper}
            PopperComponent={CustomPopper}
            sx={{ flexGrow: 1, overflow: 'hidden', '& .MuiChip-root ': { maxWidth: '40%' } }}
            groupBy={groupField ? (option) => t(option[groupField as keyof T] as string) : undefined}
          />
          <Tooltip title={t('Add')} arrow>
            <span>
              <IconButton
                disabled={!value.length}
                onClick={() => {
                  onSelect(value);
                  setOpen(false);
                }}
                color="primary"
              >
                <AddCircle />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t('Refresh')} arrow>
            <IconButton onClick={() => mutate()} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const CustomPaper = (props: PaperProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0.5,
        pt: 1,
        marginTop: '-0.5em',
        '& .MuiAutocomplete-groupLabel': { fontWeight: 700, lineHeight: '2em' },
        '& .MuiAutocomplete-groupUl': { my: 0.5 },
        '& li': { py: '3px !important' },
        '& li .MuiCheckbox-root': { p: '0', m: '4px' },
        '& li img': { borderRadius: '4px', height: '2.5em', objectFit: 'cover', aspectRatio: '16/9' },
        '& li > div': { display: 'flex', gap: 1, alignItems: 'center' },
      }}
      {...props}
    />
  );
};

const CustomPopper = ({ anchorEl, open, ...props }: PopperProps) => {
  const dialogAnchorEl = document.querySelector('#dialog-anchor');
  if (dialogAnchorEl && props.style) props.style.width = dialogAnchorEl.clientWidth || 0;
  return (
    <Popper
      open={open}
      anchorEl={dialogAnchorEl || anchorEl}
      {...props}
      sx={{
        '& .MuiPaper-root.MuiAutocomplete-paper': {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
        },
      }}
    />
  );
};
