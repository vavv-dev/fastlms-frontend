import { ClearOutlined } from '@mui/icons-material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  search?: string;
  setSearch?: (s: string) => void;
  placeholder?: string;
  sx?: TextFieldProps['sx'];
}

export const SimpleSearch = ({ search, setSearch, placeholder, sx }: Props) => {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <TextField
      inputRef={(input) => input && search && input.focus()}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment
              position="end"
              onClick={() => {
                setSearchInput('');
                setSearch?.('');
              }}
              sx={{ cursor: 'pointer', visibility: search ? 'visible' : 'hidden' }}
            >
              <ClearOutlined />
            </InputAdornment>
          ),
        },
      }}
      size="small"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && setSearch && setSearch(searchInput || '')}
      variant="standard"
      placeholder={placeholder || t('Search')}
      sx={{
        minWidth: '4em',
        '& .MuiInput-underline:before': { borderBottom: 'none' },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
        ...sx,
      }}
    />
  );
};
