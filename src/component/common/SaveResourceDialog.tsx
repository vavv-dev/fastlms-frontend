import { yupResolver } from '@hookform/resolvers/yup';
import { AddCircleOutlineOutlined, Close, DragHandleOutlined, LibraryAddOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  DialogProps,
  FormControlProps,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import {
  Control,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  Resolver,
  UseFormGetValues,
  UseFormSetValue,
  useController,
  useForm,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { List, arrayMove } from 'react-movable';
import * as yup from 'yup';
import { SchemaDescription } from 'yup';

import { useScrollToNewElement } from './hooks';

import { CancelablePromise } from '@/api';
import {
  AutocompleteSelect2,
  BaseDialog,
  CheckboxControl as Checkbox,
  FileFieldControl as FileField,
  Form,
  SelectControl as Select,
  TextFieldControl as Text,
  TextEditorControl as TextEditor,
  updateInfiniteCache,
  useServiceImmutable,
} from '@/component/common';
import { textEllipsisCss } from '@/helper/util';

type DeepRemoveUndefined<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRemoveUndefined<NonNullable<T[P]>>;
    }
  : NonNullable<T>;

interface CopyAutocomplete {
  [key: string]: {
    service: (params: object) => Promise<any>; // eslint-disable-line
    serviceParams?: object;
    labelField: string;
    groudField?: string;
    mode?: 'select' | 'copy';
    action?: React.ReactNode;
    hideAddButton?: boolean;
  };
}

interface SaveResourceDialogProps<T extends { title?: string }, K extends T & { id: string }> {
  open: boolean;
  setOpen: (open: boolean) => void;
  resourceId?: string;
  fieldSchema: yup.ObjectSchema<T>;
  retrieveService: (params: { id: string }) => Promise<K>;
  listService: () => Promise<any>; // eslint-disable-line
  createService?: (params: { requestBody: DeepRemoveUndefined<T> }) => Promise<K> | CancelablePromise<K>;
  partialUpdateService: (params: { id: string; requestBody: T }) => Promise<K>;
  copyAutocomplete?: CopyAutocomplete;
  maxWidth?: DialogProps['maxWidth'];
  beforeSave?: (data: T, editKey: string | undefined) => void;
}

export const SaveResourceDialog = <T extends { title?: string }, K extends T & { id: string }>({
  open,
  setOpen,
  resourceId,
  fieldSchema,
  retrieveService,
  listService,
  createService,
  partialUpdateService,
  copyAutocomplete,
  maxWidth,
  beforeSave,
}: SaveResourceDialogProps<T, K>) => {
  const { t } = useTranslation('common');
  const [editKey, setEditKey] = useState<string | undefined>(resourceId);
  const {
    data: resource,
    mutate: resourceMutate,
    error: retrieveError,
  } = useServiceImmutable<{ id: string }, T>(retrieveService, editKey ? { id: editKey } : null);

  const { trigger, handleSubmit, control, formState, reset, getValues, setValue, setError, watch } = useForm<T>({
    mode: 'onBlur',
    reValidateMode: 'onSubmit',
    resolver: yupResolver(fieldSchema) as unknown as Resolver<T>,
    defaultValues: fieldSchema.getDefault(),
  });

  useEffect(() => {
    const subscription = watch((_, { name }) => {
      if (name?.toString().endsWith('.kind')) {
        setTimeout(() => {
          trigger(name.toString().replace('.kind', '.selections') as Path<T>);
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  // scroll to newly added element
  useScrollToNewElement<T>(watch);

  useEffect(() => {
    if (retrieveError) setError('root.server', retrieveError);
  }, [retrieveError]); // eslint-disable-line

  useEffect(() => {
    if (!editKey || !resource || !open) return;
    reset({ ...resource, ...fixDatetimeDispaly(resource) });
  }, [editKey, resource, open, reset]); // eslint-disable-line

  // force reset when dialog is closed
  useEffect(() => {
    if (!open) {
      setEditKey(undefined);
      reset(fieldSchema.getDefault());
    }
  }, [open, reset, fieldSchema]);

  const saveResource = async (data: T) => {
    // transform datetime-local to ISO string
    const datetimeFields = getDatetimeFields();
    const transformed = { ...data };
    datetimeFields.forEach((key) => {
      const browerDate = transformed[key];
      if (!browerDate) return;
      // @ts-expect-error datetime fields key
      transformed[key] = new Date(browerDate as string).toISOString();
    });

    const service = editKey ? partialUpdateService : createService;
    if (!service) return;

    // resolve base64 image
    for (const key in transformed) {
      if (transformed[key] instanceof Promise) {
        transformed[key] = await transformed[key];
      }
    }

    try {
      beforeSave?.(transformed, editKey);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        error.inner.forEach((err) => {
          if (err.path) {
            setError(err.path as Path<T>, {
              type: 'custom',
              message: err.message,
            });
          }
        });
        return;
      }
      setError('root.server', error as Error);
      return;
    }

    service({
      id: editKey || '',
      requestBody: transformed as DeepRemoveUndefined<T> & T,
    })
      .then((saved) => {
        if (editKey) resourceMutate({ ...resource, ...saved }, { revalidate: false });
        else setEditKey(saved.id);

        // update list cache
        updateInfiniteCache<T & { id: string }>(listService, saved, editKey ? 'update' : 'create');
      })
      .catch((error) => setError('root.server', error));
  };

  const fixDatetimeDispaly = (resource: T): Record<keyof T, string> => {
    if (!resource) return {} as Record<keyof T, string>;
    // transform server date to browser datetime-local
    return getDatetimeFields().reduce(
      (acc, key) => {
        const serverDate = resource[key];
        if (serverDate) {
          const datetime = new Date(serverDate as string);
          const tzOffset = datetime.getTimezoneOffset() * 60000;
          const localDatetiem = new Date(datetime.getTime() - tzOffset);
          acc[key] = new Date(localDatetiem).toISOString().slice(0, 16);
        } else {
          acc[key] = '';
        }
        return acc;
      },
      {} as Record<keyof T, string>,
    );
  };

  const getDatetimeFields = () => {
    return Object.entries(fieldSchema.fields).reduce(
      (acc, [key, field]) => {
        if (field.describe().meta?.control === 'datetime-local') acc.push(key as keyof T);
        return acc;
      },
      [] as (keyof T)[],
    );
  };

  return (
    <BaseDialog
      fullWidth
      isReady
      open={open}
      setOpen={setOpen}
      actions={
        <>
          <Button
            disabled={!formState.isDirty}
            onClick={() => (resource ? reset({ ...resource, ...fixDatetimeDispaly(resource) }) : reset())}
            color="primary"
          >
            {t('Reset')}
          </Button>
          <Button disabled={!formState.isDirty || formState.isSubmitting} form="save-resource" type="submit" color="primary">
            {t('Save')}
          </Button>
        </>
      }
      maxWidth={maxWidth || 'md'}
      renderContent={(containerRef) => (
        <Form id="save-resource" onSubmit={handleSubmit(saveResource)} formState={formState} setError={setError}>
          <Grid container spacing={2}>
            {Object.entries(fieldSchema.fields).map(([key, field]) => {
              const fieldData = field.describe();
              if (fieldData.meta?.hidden) return null;
              if (fieldData.type == 'object') {
                return (
                  <Grid size={{ xs: 12 }} key={key}>
                    <Typography variant="caption">{fieldData.label}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {Object.entries(fieldData.fields).map(([innerKey, _innerFieldData]) => (
                        <Box key={`${key}.${innerKey}`} sx={{ display: 'flex', flexGrow: 1 }}>
                          <DrawField
                            containerRef={containerRef}
                            name={`${key}.${innerKey}` as Path<T>}
                            fieldData={_innerFieldData as SchemaDescription}
                            control={control}
                            formState={formState}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                );
              } else if (fieldData.type == 'array') {
                return (
                  <ArrayFieldTable
                    key={key}
                    fieldKey={key as Path<T>}
                    fieldData={fieldData}
                    control={control}
                    formState={formState}
                    getValues={getValues}
                    setValue={setValue}
                    containerRef={containerRef}
                    copyAutocomplete={copyAutocomplete}
                  />
                );
              } else {
                return (
                  <Grid size={{ xs: fieldData.meta?.grid || 12 }} key={key}>
                    <DrawField
                      containerRef={containerRef}
                      name={key as Path<T>}
                      fieldData={fieldData}
                      control={control}
                      formState={formState}
                    />
                  </Grid>
                );
              }
            })}
          </Grid>
        </Form>
      )}
    />
  );
};

interface DrawFieldProps<T extends FieldValues> {
  containerRef: React.RefObject<HTMLDivElement | null>;
  name: Path<T>;
  fieldData: SchemaDescription;
  hideLabel?: boolean;
  margin?: FormControlProps['margin'];
  control: Control<T>;
  formState: {
    errors: FieldErrors<T>;
  };
  lazy?: boolean;
}

const DrawField = <T extends FieldValues>({
  containerRef,
  name,
  fieldData,
  hideLabel = false,
  margin = 'dense',
  control,
  formState,
  lazy = false,
}: DrawFieldProps<T>) => {
  const { t } = useTranslation('common');
  const [isActive, setIsActive] = useState(!lazy);
  const { field } = useController({ name, control });

  const handleActivation = (event: React.MouseEvent | React.KeyboardEvent) => {
    setIsActive(true);
    event.persist();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleActivation(event);
    }
  };

  const required = !fieldData.optional && !fieldData.nullable;
  const baseProps = {
    name,
    type: fieldData.meta?.control,
    control,
    label: !hideLabel ? fieldData.label || '' : '',
    helperText: (formState.errors[name]?.message as string) || fieldData.meta?.helperText,
    required,
    readOnly: fieldData.meta?.readOnly,
    disabled: fieldData.meta?.disabled,
  };
  const props = {
    ...baseProps,
    slotProps: { inputLabel: { shrink: true } },
  };

  if (fieldData.meta?.control === 'thumbnail') {
    return (
      <Box
        sx={{
          backgroundImage: `url(${field.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '80px',
          height: 'auto',
          aspectRatio: '16/9',
          borderRadius: '4px',
        }}
      />
    );
  }

  const readOnly = baseProps.readOnly;

  if (lazy && !isActive && typeof field.value !== 'boolean') {
    return (
      <Box
        onClick={readOnly ? undefined : handleActivation}
        onKeyDown={handleKeyDown}
        tabIndex={readOnly ? undefined : 0}
        sx={{
          fontSize: '13px',
          width: '100%',
          minHeight: '1.5em',
          cursor: 'text',
          ...textEllipsisCss(1),
          '&:focus': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        }}
      >
        {field.value != null ? (typeof field.value === 'string' ? t(field.value) : String(field.value)) : ''}
      </Box>
    );
  }

  const renderControl = () => {
    switch (fieldData.meta?.control) {
      case 'checkbox':
        return <Checkbox {...props} margin={margin} />;
      case 'editor':
        return (
          <TextEditor
            containerRef={containerRef}
            {...props}
            margin={margin}
            placeholder={fieldData.meta?.placeholderText}
            minHeight={100}
          />
        );
      case 'select':
        return <Select {...props} margin={margin} options={fieldData.meta?.options || []} />;
      case 'file':
        return <FileField {...baseProps} shrink inputProps={{ accept: fieldData.meta?.accept }} />;
      default:
        return (
          <Text
            {...props}
            margin={margin}
            focusSelect
            focusMultiLine
            multiline={fieldData.meta?.multiline}
            placeholder={fieldData.meta?.placeholderText}
            useArrayNewline={fieldData.meta?.useArrayNewline}
          />
        );
    }
  };

  return renderControl();
};

interface ArrayFieldTableProps<T extends FieldValues> {
  fieldKey: Path<T>;
  fieldData: SchemaDescription & {
    innerType: {
      fields: Record<string, SchemaDescription>;
      default: Record<string, unknown>;
    };
  };
  control: Control<T>;
  formState: {
    errors: FieldErrors<T>;
  };
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  copyAutocomplete?: CopyAutocomplete;
}

const ArrayFieldTable = <T extends FieldValues>({
  fieldKey,
  fieldData,
  control,
  formState,
  getValues,
  setValue,
  containerRef,
  copyAutocomplete,
}: ArrayFieldTableProps<T>) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const [autocompleteOpen, setAutocompleteOpen] = useState<string>('');
  const arrayValues = getValues(fieldKey) || [];
  const arrayFieldError = formState.errors[fieldKey as keyof typeof formState.errors] as FieldError;
  const [cellWidths, setCellWidths] = useState<string[]>([]);

  const handleReorder = (oldIndex: number, newIndex: number) => {
    const newOrder = arrayMove(arrayValues, oldIndex, newIndex);
    setValue(fieldKey, newOrder as PathValue<T, Path<T>>, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Grid size={{ xs: 12 }}>
      <TableContainer
        sx={{
          '& th': { whiteSpace: 'nowrap' },
          '& .MuiInput-input': { fontSize: '13px' },
          '& fieldset': { border: 'none' },
          '& .MuiInput-underline:not(.Mui-error):before': { borderBottom: 'none' },
          '& .MuiInput-underline:hover:not(.Mui-disabled):not(.Mui-error):before': { borderBottom: 'none' },
          '& input[type="text"]:focus, & textarea:focus': { minWidth: '400px' },
          '& .MuiSelect-select': { p: 0, pr: '2em' },
          '& .MuiCheckbox-root': { p: 0 },
          '& .MuiFormHelperText-root': { ...textEllipsisCss(1), lineHeight: '1em' },
          '& input': { textOverflow: 'ellipsis' },
          // fix table cell width infinite flickering
          '& .MuiInputBase-inputMultiline': { overflow: 'hidden !important' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">
            {fieldData.label} {!fieldData.optional && !fieldData.nullable && '*'}
          </Typography>
          {arrayFieldError?.message && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {t(arrayFieldError.message as string)}
            </Typography>
          )}
          {arrayFieldError?.root?.message && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {t(arrayFieldError.root.message as string)}
            </Typography>
          )}
          <Box sx={{ flexGrow: 1 }} />
          {copyAutocomplete?.[fieldKey] && (
            <>
              {copyAutocomplete[fieldKey].action && copyAutocomplete?.[fieldKey].action}
              <Tooltip
                title={t('Copy')}
                arrow
                onClick={() => setAutocompleteOpen(autocompleteOpen === fieldKey ? '' : fieldKey)}
              >
                <IconButton color="primary">
                  <LibraryAddOutlined />
                </IconButton>
              </Tooltip>
              {!copyAutocomplete[fieldKey].hideAddButton && (
                <Tooltip title={t('Add')} arrow>
                  <IconButton
                    color="primary"
                    onClick={() => {
                      const defaultValue = fieldData.innerType.default;
                      setValue(fieldKey, [...(arrayValues || []), defaultValue] as PathValue<T, Path<T>>, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <AddCircleOutlineOutlined />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
        <List<T>
          disabled={!fieldData.meta?.orderable}
          lockVertically
          values={arrayValues}
          onChange={({ oldIndex, newIndex }) => handleReorder(oldIndex, newIndex)}
          renderList={({ children, props }) => (
            <Table size="small">
              <TableHead>
                <TableRow>
                  {fieldData.meta?.orderable && <TableCell></TableCell>}
                  <TableCell>#</TableCell>
                  {'thumbnail' in fieldData && <TableCell>{t('Thumbnail')}</TableCell>}
                  {Object.entries(fieldData.innerType.fields).map(([innerKey, innerFieldData]) =>
                    innerFieldData.meta?.hidden ? null : (
                      <TableCell key={`${fieldKey}.${innerKey}`}>{innerFieldData.label}</TableCell>
                    ),
                  )}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody {...props}>{children}</TableBody>
            </Table>
          )}
          beforeDrag={({ elements, index }) => {
            const cells = Array.from(elements[index].children);
            setCellWidths(cells.map((cell) => window.getComputedStyle(cell).width));
          }}
          renderItem={({ value, props, isDragged }) => {
            const index = arrayValues.findIndex((item) => item === value);
            const row = (
              <TableRow
                {...props}
                key={`${fieldKey}.${index}`}
                sx={{
                  zIndex: isDragged ? theme.zIndex.modal + 1 : 'auto',
                  boxShadow: isDragged ? theme.shadows[4] : 'none',
                  '& > td': isDragged
                    ? {
                        ...cellWidths.reduce((acc, width, i) => ({ ...acc, [`&:nth-of-type(${i + 1})`]: { width } }), {}),
                        '& .MuiInput-underline:not(.Mui-error):before': { borderBottom: 'none' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):not(.Mui-error):before': { borderBottom: 'none' },
                        '& input[type="text"]:focus, & textarea:focus': { minWidth: '400px' },
                        '& .MuiSelect-select': { p: 0, pr: '2em' },
                        '& .MuiCheckbox-root': { p: 0 },
                        '& .MuiFormHelperText-root': { ...textEllipsisCss(1), lineHeight: '1em' },
                        bgcolor: theme.palette.action.hover,
                      }
                    : {},
                }}
              >
                {/* do not remove framgment. it's required for forwardRef key */}
                <>
                  {fieldData.meta?.orderable && (
                    <TableCell data-movable-handle sx={{ width: '2em', cursor: isDragged ? 'grabbing' : 'grab' }}>
                      <DragHandleOutlined fontSize="small" />
                    </TableCell>
                  )}
                  <TableCell>{index + 1}</TableCell>
                  {Object.entries(fieldData.innerType.fields).map(([innerKey, innerFieldData]) =>
                    innerFieldData.meta?.hidden ? null : (
                      <TableCell key={`${fieldKey}.${index}.${innerKey}`}>
                        <DrawField
                          containerRef={containerRef}
                          name={`${fieldKey}.${index}.${innerKey}` as Path<T>}
                          fieldData={innerFieldData}
                          hideLabel
                          margin="none"
                          control={control}
                          formState={formState}
                          lazy={!!value.id}
                        />
                      </TableCell>
                    ),
                  )}
                  <TableCell sx={{ width: '3em' }}>
                    <IconButton
                      onClick={() => {
                        const remains = arrayValues.filter((_, j) => j !== index);
                        if (remains.length === 0) {
                          // https://github.com/react-hook-form/react-hook-form/issues/10862
                          setValue(fieldKey, null as PathValue<T, Path<T>>, { shouldDirty: true, shouldValidate: true });
                          setValue(fieldKey, fieldData.default as PathValue<T, Path<T>>);
                        } else {
                          setValue(fieldKey, remains as PathValue<T, Path<T>>, { shouldDirty: true, shouldValidate: true });
                        }
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </TableCell>
                </>
              </TableRow>
            );

            return isDragged ? (
              <Table>
                <TableBody sx={{ '& td': { py: '.5em' } }}>{row}</TableBody>
              </Table>
            ) : (
              row
            );
          }}
        />
      </TableContainer>
      {copyAutocomplete?.[fieldKey]?.service && autocompleteOpen === fieldKey && (
        <AutocompleteSelect2
          service={copyAutocomplete[fieldKey].service}
          serviceParams={copyAutocomplete[fieldKey].serviceParams}
          labelField={copyAutocomplete[fieldKey].labelField}
          groupField={copyAutocomplete[fieldKey].groudField}
          open={autocompleteOpen === fieldKey}
          setOpen={() => setAutocompleteOpen(autocompleteOpen === fieldKey ? '' : fieldKey)}
          placeholder={`${t('Select {{ type }}', { type: fieldData.label })} `}
          onSelect={(selected) => {
            const max = fieldData.meta?.max;
            const updated = [
              ...(arrayValues || []),
              ...selected.map((s) => ({
                ...fieldData.innerType.default,
                ...s,
                id: copyAutocomplete[fieldKey].mode === 'select' ? s.id : undefined,
              })),
            ];
            setValue(fieldKey, (max ? updated.slice(-1 * max) : updated) as PathValue<T, Path<T>>, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          excludes={new Set(arrayValues.map((v) => v['id']))}
          selectionLimit={fieldData.meta?.max}
        />
      )}
    </Grid>
  );
};
