import { Search } from '@mui/icons-material';
import { Autocomplete, Box, InputAdornment, SxProps, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { searchSuggestVideoKeywords } from '@/api';
import { useDebounce, useServiceImmutable } from '@/component/common';
import { getRegExp } from '@/helper/search';

export const Input = ({ sx }: { sx?: SxProps }) => {
  const { t } = useTranslation('video');
  const navigate = useNavigate();
  const [value, setValue] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const debouncedInputValue = useDebounce(inputValue, 100);
  const { data } = useServiceImmutable(searchSuggestVideoKeywords, { q: debouncedInputValue });
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hover, setHover] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const prevOptions = useRef<string[]>([]);
  const q = useSearchParams()[0].get('q');

  const matcher = (v: string) => {
    const noSpace = v.replace(/\s/g, '');
    return getRegExp(noSpace, { ignoreSpace: true, ignoreCase: true, global: true });
  };

  useEffect(() => {
    if (data?.length) {
      setOptions(data);
    }
  }, [data]);

  useEffect(() => {
    if (!q) return;
    setValue(q);
  }, []); // eslint-disable-line

  return (
    <Autocomplete
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onBlur={() => setOpen(false)}
      open={open}
      autoSelect
      // autoComplete
      onOpen={() => setOpen(true)}
      value={value}
      onChange={(_, newValue) => setValue(newValue || '')}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
        if (!newInputValue) {
          setOpen(false);
        }
      }}
      freeSolo
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.defaultMuiPrevented = true;
          setOpen(false);
          if (!inputValue) navigate(`/`);
          else navigate(`/video/search?q=${inputValue}`);
        }
      }}
      size="small"
      autoHighlight
      options={options || []}
      renderInput={(params) => (
        <TextField
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={t('Search')}
          variant="outlined"
          {...params}
          slotProps={{
            input: {
              ...params.InputProps,
              style: { borderRadius: '2em', paddingLeft: '1em' },
              startAdornment:
                focus || hover ? (
                  <InputAdornment position="start" sx={{ mr: 0 }}>
                    <Search />
                  </InputAdornment>
                ) : undefined,

              ...(!(focus || hover) && {
                endAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0 }}>
                    <Search />
                  </InputAdornment>
                ),
              }),
            },
          }}
        />
      )}
      disableClearable={!(focus || hover)}
      sx={{
        '& .MuiAutocomplete-option *': { whiteSpace: 'nowrap' },
        '& .MuiAutocomplete-root .MuiFormControl-root .MuiInputBase-root': { flexWrap: 'nowrap' },
        maxWidth: '400px',
        width: '100%',
        ...sx,
      }}
      renderOption={(props, option, { inputValue }) => {
        const pattern = inputValue ? matcher(inputValue) : inputValue;
        let suggestion = option;
        if (inputValue && suggestion.match(pattern)) {
          suggestion = suggestion.replace(pattern, (matched: string) => `<strong>${matched}</strong>`);
        }
        return (
          <li {...props} key={option}>
            <Box dangerouslySetInnerHTML={{ __html: suggestion }} />
          </li>
        );
      }}
      filterOptions={(options, { inputValue }) => {
        const pattern = inputValue ? matcher(inputValue) : inputValue;
        let candidates = options.filter((option) => !inputValue || option.match(pattern));
        if (candidates.length === 0) candidates = prevOptions.current;
        prevOptions.current = candidates;
        return candidates;
      }}
    />
  );
};
