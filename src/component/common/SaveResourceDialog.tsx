import { CancelablePromise } from '@/api';
import {
  AutocompleteSelect2,
  BaseDialog,
  CheckboxControl,
  Form,
  SelectControl,
  TextEditorControl,
  TextFieldControl,
  updateInfiniteCache,
  useServiceImmutable,
} from '@/component/common';
import { textEllipsisCss } from '@/helper/util';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddCircleOutlineOutlined, Close, ContentCopyOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  DialogProps,
  FormControlProps,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Path, PathValue, Resolver, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { SchemaDescription } from 'yup';

type DeepRemoveUndefined<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRemoveUndefined<NonNullable<T[P]>>;
    }
  : NonNullable<T>;

interface SaveResourceDialogProps<T extends { title?: string }, K extends T & { id: string }> {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  resourceId?: string;
  fieldSchema: yup.ObjectSchema<T>;
  retrieveService: (params: { id: string }) => Promise<K>;
  listService: () => Promise<any>; // eslint-disable-line
  createService: (params: { requestBody: DeepRemoveUndefined<T> }) => Promise<K> | CancelablePromise<K>;
  partialUpdateService: (params: { id: string; requestBody: T }) => Promise<K>;
  copyAutocomplete?: {
    [key: string]: {
      service: (params: object) => Promise<any>; // eslint-disable-line
      labelField: string;
    };
  };
  maxWidth?: DialogProps['maxWidth'];
}

const SaveResourceDialog = <T extends { title?: string }, K extends T & { id: string }>({
  title,
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
}: SaveResourceDialogProps<T, K>) => {
  const { t } = useTranslation('common');
  const [editKey, setEditKey] = useState<string | undefined>(resourceId);
  const {
    data: resource,
    mutate: resourceMutate,
    error: retrieveError,
  } = useServiceImmutable<{ id: string }, T>(retrieveService, editKey ? { id: editKey } : null);

  // dynamic copy service
  const [autocompleteOpen, setAutocompleteOpen] = useState<string>('');
  const { handleSubmit, control, formState, reset, getValues, setValue, setError } = useForm<T>({
    mode: 'onBlur',
    reValidateMode: 'onSubmit',
    resolver: yupResolver(fieldSchema) as unknown as Resolver<T>,
    defaultValues: fieldSchema.getDefault(),
  });

  useEffect(() => {
    if (retrieveError) {
      setError('root.server', { message: t('Failed to retrieve data') });
    }
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

  const saveResource = (data: T) => {
    // transform datetime-local to ISO string
    const datetimeFields = getDatetimeFields();
    const transformed = { ...data };
    datetimeFields.forEach((key) => {
      const browerDate = transformed[key];
      if (!browerDate) return;
      // @ts-expect-error datetime fields key
      transformed[key] = new Date(browerDate as string).toISOString();
    });

    (!editKey ? createService : partialUpdateService)({
      id: editKey || '',
      requestBody: transformed as DeepRemoveUndefined<T> & T,
    })
      .then((saved) => {
        editKey ? resourceMutate({ ...resource, ...saved }, { revalidate: false }) : setEditKey(saved.id);

        // update list cache
        updateInfiniteCache<T & { id: string }>(listService, saved, editKey ? 'update' : 'create');
      })
      .catch((error) => {
        setError('root.server', error.body);
      });
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
        }
        return acc;
      },
      {} as Record<keyof T, string>,
    );
  };

  const getDatetimeFields = () => {
    return Object.entries(fieldSchema.fields).reduce(
      (acc, [key, field]) => {
        field.describe().meta?.control === 'datetime-local' && acc.push(key as keyof T);
        return acc;
      },
      [] as (keyof T)[],
    );
  };

  const DrawField = (
    containerRef: React.MutableRefObject<HTMLDivElement | null>,
    key: string,
    fieldData: SchemaDescription,
    hideLabel?: boolean,
    margin: FormControlProps['margin'] = 'dense',
  ) => {
    // function type is faster then jsx. why???
    const required = (fieldData as SchemaDescription).tests.some((test) => test.name === 'required');
    const props = {
      name: key,
      type: fieldData.meta?.control,
      control: control,
      label: !hideLabel ? fieldData.label || '' : '',
      InputLabelProps: { shrink: true },
      helperText: (formState.errors[key as keyof T]?.message as string) || fieldData.meta?.helperText,
      required,
    };

    switch (fieldData.meta?.control) {
      case 'checkbox':
        return <CheckboxControl {...props} margin={margin} />;
      case 'editor':
        return (
          <TextEditorControl
            containerRef={containerRef}
            {...props}
            margin={margin}
            placeholder={fieldData.meta?.placeholderText}
          />
        );
      case 'select':
        return <SelectControl {...props} margin={margin} options={fieldData.meta?.options || []} />;
      default:
        return (
          <TextFieldControl
            {...props}
            margin={margin}
            focusSelect
            focusMultiLine
            multiline={fieldData.meta?.multiline}
            placeholder={fieldData.meta?.placeholderText}
          />
        );
    }
  };

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={`${title} ${resource ? t('Update') : t('Add')}`}
      actions={
        <>
          <Button
            disabled={!formState.isDirty}
            onClick={() => {
              resource
                ? reset({
                    ...resource,
                    ...fixDatetimeDispaly(resource),
                  })
                : reset();
            }}
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
                  <Grid item xs={12} key={key}>
                    <Typography variant="caption">{fieldData.label}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {Object.entries(fieldData.fields).map(([innerKey, _innerFieldData]) => (
                        <Box key={`${key}.${innerKey}`} sx={{ display: 'flex', flexGrow: 1 }}>
                          {DrawField(containerRef, `${key}.${innerKey}`, _innerFieldData as SchemaDescription)}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                );
              } else if (fieldData.type == 'array') {
                const arrayValues = getValues(key as Path<T>) as [];
                return (
                  <Grid item xs={12} key={key}>
                    <TableContainer
                      sx={{
                        '& th': { whiteSpace: 'nowrap' },
                        '& fieldset': { border: 'none' },
                        '& .MuiInput-underline:not(.Mui-error):before': { borderBottom: 'none' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):not(.Mui-error):before': { borderBottom: 'none' },
                        '& input[type="text"]:focus, & textarea:focus': { minWidth: '400px' },
                        '& .MuiSelect-select': { p: 0, pr: '2em' },
                        '& .MuiCheckbox-root': { p: 0 },
                        // this cause the td width flickering
                        // '& .MuiTableRow-root .MuiTableCell-root:last-child': { padding: '0.5em' },
                        '& .MuiFormHelperText-root': { ...textEllipsisCss(2), lineHeight: '1em' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">{fieldData.label}</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        {copyAutocomplete?.[key] && (
                          <Tooltip
                            title={t('Copy')}
                            arrow
                            onClick={() => setAutocompleteOpen(autocompleteOpen == key ? '' : key)}
                          >
                            <IconButton color="primary">
                              <ContentCopyOutlined />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('Add')} arrow>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              const defaultValue = field.innerType.getDefault();
                              setValue(key as Path<T>, [...arrayValues, defaultValue] as PathValue<T, Path<T>>, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                          >
                            <AddCircleOutlineOutlined />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            {Object.entries(fieldData.innerType.fields).map(([innerKey, _innerFieldData]) => {
                              const innerFieldData = _innerFieldData as SchemaDescription;
                              if (innerFieldData.meta?.hidden) return null;
                              return <TableCell key={`${key}.${innerKey}`}>{innerFieldData.label}</TableCell>;
                            })}
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {arrayValues?.map((_, i) => (
                            <TableRow hover key={`${key}.${i}`}>
                              <TableCell>{i + 1}</TableCell>
                              {Object.entries(fieldData.innerType.fields).map(([innerKey, _innerFieldData]) => {
                                const innerFieldData = _innerFieldData as SchemaDescription;
                                if (innerFieldData.meta?.hidden) return null;

                                return (
                                  <TableCell key={`${key}.${i}.${innerKey}`}>
                                    {DrawField(containerRef, `${key}.${i}.${innerKey}`, innerFieldData, true, 'none')}
                                  </TableCell>
                                );
                              })}
                              <TableCell sx={{ width: '3em' }}>
                                <IconButton
                                  onClick={() => {
                                    // fix. force re-render when last element is removed
                                    const remains = arrayValues.filter((_, j) => i !== j);
                                    if (remains.length == 0) {
                                      setValue(key as Path<T>, null as PathValue<T, Path<T>>, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      });
                                    }
                                    setValue(key as Path<T>, remains as PathValue<T, Path<T>>, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {copyAutocomplete?.[key]?.service && autocompleteOpen == key && (
                      <AutocompleteSelect2
                        service={copyAutocomplete[key].service}
                        labelField={copyAutocomplete[key].labelField}
                        open={autocompleteOpen == key}
                        setOpen={() => setAutocompleteOpen(autocompleteOpen == key ? '' : key)}
                        placeholder={`${t('Copy')} ${fieldData.label}`}
                        onSelect={(selected) => {
                          setValue(
                            key as Path<T>,
                            [...(arrayValues || []), ...selected.map((s) => ({ ...s, id: undefined }))] as PathValue<T, Path<T>>,
                            { shouldDirty: true, shouldValidate: true },
                          );
                        }}
                      />
                    )}
                  </Grid>
                );
              } else {
                return (
                  <Grid item xs={fieldData.meta?.grid || 12} key={key}>
                    {DrawField(containerRef, key, fieldData)}
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

export default SaveResourceDialog;
