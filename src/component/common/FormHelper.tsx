import { CheckOutlined, Close, Visibility, VisibilityOff } from '@mui/icons-material';
import PhotoSizeSelectActualOutlinedIcon from '@mui/icons-material/PhotoSizeSelectActualOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormControlProps,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  InputLabelProps,
  InputProps,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SxProps,
  TextField,
  TextFieldProps,
  useTheme,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import TextEditor from './TextEditor';

interface IFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formState: any; // eslint-disable-line
  setError: any; // eslint-disable-line
  children: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

export const Form: React.FC<IFormProps> = ({ onSubmit, formState, setError, children, disabled, id }) => {
  const [noneFieldErrors, setNoneFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    const errorsFromServer = formState.errors?.root?.server || {};
    for (const key in errorsFromServer) {
      const message = errorsFromServer[key];
      if (!message) continue;

      if (Array.isArray(message) && message.every((item) => typeof item === 'object')) {
        const flattenedMessage = message
          .filter((obj) => Object.keys(obj).length)
          .map((obj) => {
            return Object.entries(obj)
              .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
              .join(' / ');
          });

        if (key in formState.defaultValues) {
          // Set field error
          setError(key, { type: key, message: flattenedMessage.join(' / ') }, { shouldFocus: true });
        } else {
          const nonFeildKey = key == 'detail' || key == 'message' ? '' : `${key}: `;
          setNoneFieldErrors((prev) => [...prev, `${nonFeildKey}${flattenedMessage.join(' / ')}`]);
        }
      } else {
        if (key in formState.defaultValues) {
          setError(key, { type: key, message: message }, { shouldFocus: true });
        } else {
          const nonFeildKey = key == 'detail' || key == 'message' ? '' : `${key}: `;
          setNoneFieldErrors((prev) => [...prev, `${nonFeildKey}${message}`]);
        }
      }
    }

    return () => {
      setNoneFieldErrors([]);
    };
  }, [formState.errors?.root?.server, formState.defaultValues, setError]);

  return (
    <form id={id} onSubmit={!disabled && formState.isSubmitting ? undefined : onSubmit} noValidate>
      <Collapse in={noneFieldErrors.length > 0}>
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setNoneFieldErrors([])}>
          {noneFieldErrors.join('\n\r')}
        </Alert>
      </Collapse>
      <fieldset disabled={disabled || formState.isSubmitting} style={{ border: 'none', padding: 0, margin: 0 }}>
        {children}
      </fieldset>
    </form>
  );
};

interface ICheckboxControlProps extends Omit<FormControlProps, 'defaultValue'> {
  name: string;
  label: string | JSX.Element;
  control: any; // eslint-disable-line
  helperText?: string | null;
  defaultValue?: boolean;
}

export const CheckboxControl = ({ name, label, control, helperText, defaultValue = false, ...props }: ICheckboxControlProps) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <FormControl margin={props.margin || 'dense'} error={!!error} fullWidth sx={{ mt: 1, ...props.sx }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              sx={!label ? { ml: 0 } : undefined}
              label={label}
              control={<Checkbox {...field} checked={field.value} required={props.required} />}
            />
            {props.children}
          </Box>
          <FormHelperText variant={props.variant || 'standard'} sx={{ mt: 0 }}>
            {error?.message ? error.message : helperText ? helperText : helperText == null ? '' : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};

interface ITextFieldControlProps extends Omit<TextFieldProps, 'type'> {
  name: string;
  control: any; // eslint-disable-line
  type?: string;
  readOnly?: boolean;
  defaultValue?: string | number | null;
  formLabel?: React.ReactNode;
  placeholder?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  focusMultiLine?: boolean;
  focusSelect?: boolean;
}

export const TextFieldControl = ({
  name,
  control,
  formLabel,
  type,
  // Html number input treat value as string
  defaultValue = '',
  helperText,
  placeholder,
  startAdornment,
  endAdornment,
  sx,
  focusMultiLine,
  focusSelect,
  disabled,
  fullWidth = true,
  ...props
}: ITextFieldControlProps) => {
  const { t } = useTranslation('common');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { ref, ...field }, fieldState: { error } }) => (
        <FormControl disabled={disabled} fullWidth={fullWidth} error={!!error}>
          {formLabel && (
            <FormLabel focused={focused} required={props.required}>
              {formLabel}
            </FormLabel>
          )}
          <TextField
            disabled={disabled}
            label={props.label}
            variant={props.variant || 'standard'}
            autoComplete={props.autoComplete || name}
            placeholder={placeholder ? placeholder : type == 'number' ? t('Enter a number') : ''}
            required={props.required || false}
            error={!!error}
            fullWidth={fullWidth}
            margin={props.margin || 'dense'}
            type={type == 'password' ? (showPassword ? 'text' : 'password') : type}
            sx={{ '& .MuiFormHelperText-root': { ml: 0 }, ...sx }}
            helperText={error?.message ? error.message : helperText ? helperText : helperText == null ? '' : ' '}
            InputProps={{
              readOnly: props.readOnly,
              ...(startAdornment && { startAdornment }),
              ...(endAdornment && { endAdornment }),
              ...(!endAdornment &&
                type == 'password' && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }),
            }}
            {...field}
            {...props}
            onFocus={(e) => {
              setFocused(true);
              if (focusSelect) e.target.select();
            }}
            onBlur={(e) => {
              setFocused(false);
              field.onBlur();
              if (props.onBlur) props.onBlur(e);
            }}
            onInput={(e) => {
              if (type == 'number') {
                const target = e.target as HTMLInputElement;
                const numberValue = target.value.replace(/[^0-9]/g, '');
                target.value = numberValue;
                field.onChange(numberValue);
              }
            }}
            inputRef={ref}
            {...(focusMultiLine && { rows: focused ? 0 : 1 })}
          />
        </FormControl>
      )}
    />
  );
};

interface IFileFieldControlProps extends Omit<InputProps, 'type'> {
  name: string;
  label: string;
  control: any; // eslint-disable-line
  variant?: 'standard' | 'outlined' | 'filled';
  helperText?: string | null;
  InputLabelProps?: InputLabelProps;
}

export const FileFieldControl = ({ name, label, control, helperText, InputLabelProps, ...props }: IFileFieldControlProps) => {
  const { t } = useTranslation('common');
  const inputRef = useRef(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl margin={props.margin || 'dense'} error={!!error}>
          {label && (
            <InputLabel
              required={props.required}
              variant={props.variant || 'standard'}
              shrink={true}
              htmlFor={name}
              {...InputLabelProps}
            >
              {label}
            </InputLabel>
          )}
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-end' }}>
            <Button
              component="label"
              htmlFor={name}
              size="large"
              sx={{ mt: 2, p: 1, width: '100%', gap: 1 }}
              variant="contained"
            >
              {field.value?.[0] ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckOutlined />
                  {typeof field.value === 'string' ? field.value.split('/').pop() : field.value?.[0]?.name}
                  <Close
                    fontSize="small"
                    onClick={(e) => {
                      e.preventDefault();
                      field.onChange(null);
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                  <PhotoSizeSelectActualOutlinedIcon fontSize="small" />
                  {t('Choose file')}
                </Box>
              )}
            </Button>
            <Input
              id={name}
              type="file"
              {...props}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                field.onChange(e.target.files ? [...e.target.files] : null);
              }}
              sx={{ width: 0 }}
              ref={inputRef}
              inputProps={{ style: { cursor: 'pointer' }, ...props.inputProps }}
            />
          </Box>
          <FormHelperText variant={props.variant || 'standard'}>
            {error?.message ? error.message : helperText ? helperText : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};

interface ITextEditorControlProps extends Omit<FormControlProps, 'type'> {
  name: string;
  label?: string;
  formLabel?: string;
  control: any; // eslint-disable-line
  containerRef?: React.RefObject<HTMLDivElement>;
  helperText?: string | null;
  disabled?: boolean;
  placeholder?: string;
  minHeight?: string;
  disableFormLabelFocus?: boolean;
  sx?: SxProps;
}

export const TextEditorControl = ({
  name,
  label,
  formLabel,
  control,
  containerRef,
  helperText,
  disabled,
  placeholder,
  minHeight,
  disableFormLabelFocus = false,
  sx,
  ...props
}: ITextEditorControlProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <FormControl
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          fullWidth
          variant="standard"
          error={!!error}
          margin={props.margin || 'dense'}
        >
          {formLabel && (
            <FormLabel disabled={disabled} focused={!disableFormLabelFocus && focused} sx={{ mb: 2 }}>
              {formLabel} {props.required && '*'}
            </FormLabel>
          )}
          {label && (
            <FormLabel disabled={disabled} focused={focused} sx={{ mb: 1, fontSize: theme.typography.caption }}>
              {label} {props.required && '*'}
            </FormLabel>
          )}
          <TextEditor
            disabled={disabled}
            container={containerRef?.current}
            initialValue={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            {...(error && { borderColor: theme.palette.error.main })}
            minHeight={minHeight}
            sx={sx}
          />
          <FormHelperText variant={'standard'}>
            {error?.message ? error.message : helperText ? helperText : helperText == null ? '' : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};

interface ISelectControlProps extends FormControlProps {
  name: string;
  label?: React.ReactNode;
  options: { label: string; value: string }[];
  control: any; // eslint-disable-line
  required?: boolean;
  helperText?: string | null;
  defaultValue?: string;
  disabled?: boolean;
  disableUnderline?: boolean;
}

export const SelectControl = ({
  name,
  label,
  options,
  control,
  required,
  helperText,
  defaultValue = '',
  disabled,
  variant = 'standard',
  disableUnderline = false,
  ...props
}: ISelectControlProps) => {
  // form fieldset's disabled not affect mui select
  // https://github.com/mui/material-ui/issues/39634
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { ...field }, fieldState: { error } }) => (
        <FormControl variant={variant} margin={props.margin || 'dense'}>
          {label && <InputLabel required={required}>{label}</InputLabel>}
          <Select disableUnderline={disableUnderline} disabled={disabled} {...field}>
            {options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText variant="standard" error={!!error}>
            {error?.message ? error.message : helperText ? helperText : helperText == null ? '' : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};

interface ISelectGroupControlProps extends FormControlProps {
  name: string;
  formLabel?: React.ReactNode;
  defaultValue?: string;
  control: any; // eslint-disable-line
  required?: boolean;
  selections: string[];
  helperText?: string | null;
  disabled?: boolean;
  kind?: 'radio' | 'checkbox';
}

export const SelectGroupControl = ({
  name,
  formLabel,
  // Html number input treat value as string
  defaultValue = '',
  control,
  required,
  selections,
  helperText,
  disabled,
  kind,
}: ISelectGroupControlProps) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: { ref, ...field }, fieldState: { error } }) => (
        <FormControl error={!!error}>
          {formLabel && (
            <FormLabel disabled={disabled} required={required}>
              {formLabel}
            </FormLabel>
          )}

          {kind == 'radio' ? (
            <RadioGroup {...field}>
              {selections?.map((selection, j) => (
                <FormControlLabel
                  inputRef={ref}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    const value = (e.target as HTMLInputElement).value;
                    if (field.value === value) {
                      field.onChange('');
                    }
                  }}
                  key={j}
                  // start from 1
                  value={String(j + 1)}
                  control={<Radio />}
                  label={selection}
                />
              ))}
            </RadioGroup>
          ) : (
            <FormGroup>
              {selections?.map((selection, j) => (
                <FormControlLabel
                  disabled={disabled}
                  key={j}
                  value={String(j + 1)}
                  control={
                    <Checkbox
                      // start from 1
                      checked={!!field.value?.split(',').includes(String(j + 1))}
                      inputRef={ref}
                      onChange={(e) => {
                        const values = !field.value ? [] : field.value.split(',');
                        if (e.target.checked) {
                          values.push(String(j + 1));
                        } else {
                          values.splice(values.indexOf(String(j + 1)), 1);
                        }
                        field.onChange([...new Set(values)].join(','));
                      }}
                    />
                  }
                  label={selection}
                />
              ))}
            </FormGroup>
          )}
          <FormHelperText variant="standard" error={!!error}>
            {error?.message ? error.message : helperText ? helperText : helperText == null ? '' : ' '}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
};
