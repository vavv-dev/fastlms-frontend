import { CheckBoxOutlineBlank, CheckBoxOutlined } from '@mui/icons-material';
import { Autocomplete, Checkbox, Chip, ClickAwayListener, TextField } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface OptionType {
  label: string;
  value: string;
}

interface Props {
  options: OptionType[];
  fixedOptions?: OptionType[];
  value: string[];
  onChange: (newValue: string[]) => void;
  label: string;
  placeholder: string;
  helperText?: string;
  freeSolo?: boolean;
}

export const CheckboxAutocomplete = ({
  options,
  fixedOptions = [],
  value,
  onChange,
  label,
  placeholder,
  helperText,
  freeSolo,
}: Props) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Convert value array of strings to array of OptionType
  const selectedOptions = value.map((val) => {
    const fixedOption = fixedOptions.find((opt) => opt.value === val);
    if (fixedOption) return fixedOption;

    const option = options.find((opt) => opt.value === val);
    return option || { label: val, value: val }; // Fallback for custom values
  });

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  const handleChange = (_: React.ChangeEvent<object>, newValue: (string | OptionType)[]) => {
    const newValues = newValue.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      return item.value;
    });

    const fixedValues = fixedOptions.map((option) => option.value);
    const newValuesWithoutFixed = newValues.filter((item) => !fixedValues.includes(item));

    const sortedNewValue = newValuesWithoutFixed.sort((a, b) => {
      const indexA = options.findIndex((opt) => opt.value === a);
      const indexB = options.findIndex((opt) => opt.value === b);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      } else if (indexA !== -1) {
        return -1;
      } else if (indexB !== -1) {
        return 1;
      } else {
        return newValuesWithoutFixed.indexOf(a) - newValuesWithoutFixed.indexOf(b);
      }
    });

    onChange([...fixedValues, ...sortedNewValue]);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div ref={autocompleteRef}>
        <Autocomplete
          freeSolo={freeSolo}
          multiple
          open={open}
          onOpen={() => setOpen(true)}
          onClose={(_, reason) => {
            if (reason === 'selectOption') return;
            setOpen(false);
          }}
          options={options}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' || typeof value === 'string') {
              return option === value;
            }
            return option.value === value.value;
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.label;
          }}
          disableCloseOnSelect
          renderInput={(params) => (
            <TextField
              variant="outlined"
              slotProps={{ inputLabel: { shrink: true } }}
              margin="normal"
              {...params}
              label={label}
              placeholder={placeholder}
              helperText={helperText}
            />
          )}
          onChange={(_, newValue) => handleChange(_, newValue)}
          value={selectedOptions}
          fullWidth
          renderOption={({ key, ...props }, option, { selected }) => (
            <li key={key} {...props}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBoxOutlined fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {typeof option === 'string' ? option : option.label}
            </li>
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              if (typeof option === 'string') {
                return (
                  <Chip
                    sx={{ borderRadius: 1, height: '2.2em' }}
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    disabled={fixedOptions.some((fixed) => fixed.value === option)}
                  />
                );
              }
              return (
                <Chip
                  sx={{ borderRadius: 1, height: '2.2em' }}
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.label}
                  disabled={fixedOptions.some((fixed) => fixed.value === option.value)}
                />
              );
            })
          }
          ListboxProps={{ sx: { '& li': { height: '2.2em' } } }}
          noOptionsText={t('No options')}
          sx={{ '& .MuiFormHelperText-root': { ml: 0, mt: 0.5 } }}
        />
      </div>
    </ClickAwayListener>
  );
};
