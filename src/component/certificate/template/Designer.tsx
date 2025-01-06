import { yupResolver } from '@hookform/resolvers/yup';
import { Add, Close, FormatAlignCenter, FormatAlignLeft, FormatAlignRight } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import {
  TemplateDisplayResponse as DisplayResponse,
  CertificateGetResourceData as GetResourceData,
  CertificateGetResourceResponse as GetResourceResponse,
  TemplateResourceCreateRequest as ResourceCreateRequest,
  TemplateResourceUpdateRequest as ResourceUpdateRequest,
  TemplateControl,
  TemplateMeta,
  certificateCreateResource as createResource,
  certificateGetDisplays as getDisplays,
  certificateGetResource as getResource,
  certificateUpdateResource as updateResource,
} from '@/api';
import { Form, TextFieldControl as Text, updateInfiniteCache, useServiceImmutable } from '@/component/common';
import { base64ImageSchema, imageToBase64 } from '@/helper/util';

const PAGE_RATIOS = {
  A4_PORTRAIT: 210 / 297,
  A4_LANDSCAPE: 297 / 210,
  LETTER_PORTRAIT: 216 / 279,
  LETTER_LANDSCAPE: 279 / 216,
};

// prettier-ignore
const CONTROL_CONFIG: Record<TemplateControl['kind'], TemplateControl> = {
  title: { id: '', kind: 'title', left: '10%', top: '10%', width: '80%', font_size: 50, is_placeholder: false, text_align: 'center', content: 'Certificate', },
  document_number: { id: '', kind: 'document_number', left: '3%', top: '3%', width: 'auto', font_size: 12, is_placeholder: true, text_align: 'left', content: 'Document number', },
  completion_title: { id: '', kind: 'completion_title', left: '10%', top: '28%', width: 'auto', font_size: 24, is_placeholder: true, text_align: 'left', content: 'Completion title', },
  completion_period: { id: '', kind: 'completion_period', left: '10%', top: '36%', width: 'auto', font_size: 14, is_placeholder: true, text_align: 'left', content: 'Completion period', },
  learning_hours: { id: '', kind: 'learning_hours', left: '10%', top: '40%', width: 'auto', font_size: 14, is_placeholder: true, text_align: 'left', content: 'Learning hours', },
  name: { id: '', kind: 'name', left: '10%', top: '44%', width: 'auto', font_size: 14, is_placeholder: true, text_align: 'left', content: 'Name', },
  birthdate: { id: '', kind: 'birthdate', left: '10%', top: '48%', width: 'auto', font_size: 14, is_placeholder: true, text_align: 'left', content: 'Date of birth', },
  issuer: { id: '', kind: 'issuer', left: '10%', top: '84%', width: '80%', font_size: 30, is_placeholder: false, text_align: 'center', content: 'Issuer', },
  issue_date: { id: '', kind: 'issue_date', left: '40%', top: '78%', width: '20%', font_size: 20, is_placeholder: true, text_align: 'center', content: 'Issue date', },
};

type PageSize = TemplateMeta['page_size'];
type ControlKind = TemplateControl['kind'];
type TextAlign = TemplateControl['text_align'];

const createControl = (kind: ControlKind): TemplateControl => {
  const config = CONTROL_CONFIG[kind];
  return { ...config, id: `${kind}-${Date.now()}` };
};

const createSchema = (t: (key: string) => string) => {
  const REQUIRED = t('This field is required.');

  const controlSchema: yup.ObjectSchema<TemplateControl> = yup.object({
    id: yup.string().default(''),
    kind: yup.string<ControlKind>().default('title'),
    left: yup.string().default('0%'),
    top: yup.string().default('0%'),
    width: yup.string().default('auto'),
    font_size: yup.number().default(14),
    is_placeholder: yup.boolean().default(true),
    text_align: yup.string<TextAlign>().default('left'),
    content: yup.string().default(''),
  });

  const metaSchema: yup.ObjectSchema<TemplateMeta> = yup.object({
    page_size: yup.string<PageSize>().required(REQUIRED).default('LETTER_LANDSCAPE'),
    controls: yup
      .array()
      .of(controlSchema)
      .default(Object.entries(CONTROL_CONFIG).map(([kind]) => createControl(kind as ControlKind))),
  });

  const schema: yup.ObjectSchema<ResourceUpdateRequest> = yup.object({
    title: yup.string().required(REQUIRED).default(''),
    description: yup.string().default(''),
    meta: metaSchema,
    content: yup.string().default(''),
    background: base64ImageSchema(yup, true, t, 5),
  });
  return schema;
};

export const Designer = ({ id }: { id?: string }) => {
  const { t } = useTranslation('certificate');
  const theme = useTheme();
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState<string | undefined>(id);
  const paperRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useServiceImmutable<GetResourceData, GetResourceResponse>(getResource, {
    id: editKey || '',
  });

  const schema = useMemo(() => createSchema(t), [t]);
  const { watch, handleSubmit, control, setError, formState, reset, setValue } = useForm<ResourceUpdateRequest>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  useEffect(() => {
    if (!data) return;
    reset(data);
  }, [data, reset]);

  // background image
  const background = watch('background');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const setBackground = async (file: FileList | null) => {
    const options = { shouldDirty: true, shouldValidate: true };
    if (file && file[0]) {
      setValue('background', await imageToBase64(file[0]), options);
    } else {
      setValue('background', '', options);
      // Reset the file input value when clearing
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // page size
  const meta = watch('meta');
  if (!meta) return null;

  const pageSize = meta.page_size;
  const controls = meta.controls;

  const setMeta = (key: keyof TemplateMeta, value: PageSize | TemplateControl[]) => {
    if (!meta || meta[key] === value) return;
    setValue('meta', { ...meta, [key]: value }, { shouldDirty: true, shouldValidate: true });
  };

  const getControlExists = (controls: TemplateControl[], kind: ControlKind) => {
    return controls.some((control) => control.kind === kind);
  };

  const handleAddControl = (kind: ControlKind) => {
    if (getControlExists(controls, kind)) return;
    const newControl = createControl(kind);
    setMeta('controls', [...controls, newControl]);
    setSelectedControl(newControl.id);
  };

  const handleDeleteControl = (id: string) => {
    setMeta(
      'controls',
      controls.filter((control) => control.id !== id),
    );
    setSelectedControl(null);
  };

  const handleFontSizeChange = (id: string, newSize: number) => {
    setMeta(
      'controls',
      controls.map((control) => (control.id === id ? { ...control, font_size: newSize } : control)),
    );
  };

  const handleTextAlignChange = (id: string, newAlign: TextAlign) => {
    setMeta(
      'controls',
      controls.map((control) => (control.id === id ? { ...control, text_align: newAlign } : control)),
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !paperRef.current || !selectedControl) return;
    const paperRect = paperRef.current.getBoundingClientRect();
    const left = `${((e.clientX - paperRect.left - dragOffset.x) / paperRect.width) * 100}%`;
    const top = `${((e.clientY - paperRect.top - dragOffset.y) / paperRect.height) * 100}%`;
    setMeta(
      'controls',
      controls.map((control) => (control.id === selectedControl ? { ...control, left, top } : control)),
    );
  };

  const handleMouseUp = () => {
    if (!isDragging || !paperRef.current || !selectedControl) return;

    setIsDragging(false);
    setMeta(
      'controls',
      controls.map((control) =>
        control.id === selectedControl
          ? {
              ...control,
              left: `${parseFloat(control.left).toFixed(0)}%`,
              top: `${parseFloat(control.top).toFixed(0)}%`,
            }
          : control,
      ),
    );
  };

  const handleMouseDown = (e: React.MouseEvent, controlId: string) => {
    const controlRect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - controlRect.left,
      y: e.clientY - controlRect.top,
    });
    setSelectedControl(controlId);
    setIsDragging(true);
  };

  const handleContentChange = (id: string, newContent: string) => {
    setMeta(
      'controls',
      controls.map((control) => (control.id === id ? { ...control, content: newContent } : control)),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedControl || isEditing) return;

    const controlIndex = controls.findIndex((control) => control.id === selectedControl);
    if (controlIndex === -1) return;

    const control = controls[controlIndex];
    let newX = parseFloat(control.left);
    let newY = parseFloat(control.top);

    switch (e.key) {
      case 'ArrowUp':
        newY -= 1;
        break;
      case 'ArrowDown':
        newY += 1;
        break;
      case 'ArrowLeft':
        newX -= 1;
        break;
      case 'ArrowRight':
        newX += 1;
        break;
      case 'Escape':
        e.stopPropagation();
        setSelectedControl(null);
        break;
      default:
        return;
    }

    setMeta(
      'controls',
      controls.map((ctrl) => (ctrl.id === selectedControl ? { ...ctrl, left: `${newX}%`, top: `${newY}%` } : ctrl)),
    );
  };

  const handleControlReset = (id?: string) => {
    if (!id) {
      reset();
      // Reset the file input value after form reset
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const existing = data?.meta.controls.find((c) => c.id === id);
    setMeta(
      'controls',
      controls.map((c) => (c.id === id ? existing || createControl(c.kind) : c)),
    );
  };

  const saveTemplate = (data: ResourceUpdateRequest) => {
    const service = id ? updateResource : createResource;
    service({
      id: id || '',
      requestBody: {
        ...data,
        background: watch('background') || '',
      } as ResourceCreateRequest,
    })
      .then((saved) => {
        if (editKey) mutate({ ...data, ...saved }, { revalidate: false });
        else setEditKey(saved.id);
        // update list cache
        updateInfiniteCache<DisplayResponse>(getDisplays, saved, editKey ? 'update' : 'create');
      })
      .catch((error) => setError('root.server', error));
  };

  if (!meta) return null;

  return (
    <Grid container spacing={2} sx={{ '& *': { whiteSpace: 'nowrap' }, height: '100%' }}>
      <Grid size={{ xs: 12, md: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 1,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ textAlign: 'center', width: '100%' }}>
            {t('Configure template')}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>{t('Page size')}</InputLabel>
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => setMeta('page_size', e.target.value as PageSize)}
              label={t('Page size')}
            >
              <MenuItem value="A4_PORTRAIT">{t('A4 Portrait')}</MenuItem>
              <MenuItem value="A4_LANDSCAPE">{t('A4 Landscape')}</MenuItem>
              <MenuItem value="LETTER_PORTRAIT">{t('Letter Portrait')}</MenuItem>
              <MenuItem value="LETTER_LANDSCAPE">{t('Letter Landscape')}</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {t('Select background image')}
              <input type="file" hidden accept="image/*" onChange={(e) => setBackground(e.target.files)} ref={fileInputRef} />
              {background && (
                <Close
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setBackground(null);
                  }}
                  sx={{ p: 0 }}
                />
              )}
            </Button>
            {formState.errors.background && (
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                {formState.errors.background.message}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {Object.entries(CONTROL_CONFIG).map(([kind, config]) => {
                const controlExists = getControlExists(controls, kind as ControlKind);
                const control = controls.find((c) => c.kind === kind);
                return (
                  <Box
                    key={kind}
                    onClick={() => !controlExists && handleAddControl(kind as ControlKind)}
                    sx={{
                      opacity: controlExists ? 0.5 : 1,
                      pointerEvents: controlExists ? 'auto' : 'auto',
                      cursor: controlExists ? 'default' : 'pointer',

                      padding: theme.spacing(1),
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: theme.palette.action.hover },
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2">{t(config.content)}</Typography>
                    {controlExists && control ? (
                      <IconButton
                        sx={{ p: 0 }}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteControl(control.id);
                        }}
                      >
                        <Close />
                      </IconButton>
                    ) : (
                      <Add sx={{ color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {selectedControl && (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" gutterBottom>
                  {t('Font size')}
                </Typography>
                <Slider
                  value={controls.find((c) => c.id === selectedControl)?.font_size || 16}
                  onChange={(_, newValue) => handleFontSizeChange(selectedControl, newValue as number)}
                  min={8}
                  max={60}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>

              {!controls.find((c) => c.id === selectedControl)?.is_placeholder && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption">{t('Text align')}</Typography>
                  <ToggleButtonGroup
                    value={controls.find((c) => c.id === selectedControl)?.text_align || 'center'}
                    exclusive
                    onChange={(_, newAlign) => {
                      if (newAlign !== null) {
                        handleTextAlignChange(selectedControl, newAlign as TextAlign);
                      }
                    }}
                    size="small"
                  >
                    <ToggleButton value="left">
                      <FormatAlignLeft fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="center">
                      <FormatAlignCenter fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="right">
                      <FormatAlignRight fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              <Button size="small" onClick={() => handleControlReset(selectedControl)} sx={{ alignSelf: 'center' }}>
                {t('Reset control')}
              </Button>
            </>
          )}
        </Box>

        <Box
          sx={{
            mt: 2,
            border: `1px solid ${theme.palette.divider}`,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            justifyContent: 'center',
            '& > form': { width: '100%' },
            '& *': { whiteSpace: 'wrap' },
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ textAlign: 'center', width: '100%' }}>
            {t('Save template')}
          </Typography>
          <Form onSubmit={handleSubmit(saveTemplate)} formState={formState} setError={setError}>
            <Text
              fullWidth
              size="small"
              name="title"
              variant="outlined"
              required
              label={t('Template title')}
              control={control}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={t('Enter a title for this template. It will be used for search.')}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
              <Button
                disabled={!formState.isDirty}
                onClick={() => {
                  reset();
                  handleControlReset();
                }}
              >
                {t('Reset')}
              </Button>
              <Button disabled={!formState.isDirty || formState.isSubmitting} type="submit">
                {t('Save template')}
              </Button>
            </Box>
          </Form>
        </Box>
      </Grid>

      <Grid
        size={{ xs: 12, md: 9 }}
        sx={{
          justifyContent: 'center',
          height: '100%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          p: { xs: 1, sm: 3 },
        }}
      >
        <Paper
          ref={paperRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          elevation={3}
          sx={{
            display: 'flex',
            flexGrow: 1,
            maxHeight: '100%',
            aspectRatio: PAGE_RATIOS[pageSize],
            backgroundImage: background ? `url(${background})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            outline: 'none',
          }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {controls.map((control) => {
            const isSelected = control.id === selectedControl;
            const isCurrentlyEditing = isEditing && isSelected;

            return (
              <Tooltip
                key={control.id}
                title={`x:${parseFloat(control.left).toFixed(0)}% y:${parseFloat(control.top).toFixed(0)}%`}
                placement="right"
              >
                <Box
                  onMouseDown={(e) => handleMouseDown(e, control.id)}
                  sx={{
                    position: 'absolute',
                    left: control.left,
                    top: control.top,
                    fontSize: control.font_size,
                    width: control.width,
                    textAlign: control.text_align,
                    cursor: isDragging ? 'move' : isCurrentlyEditing ? 'text' : 'move',
                    userSelect: 'none',
                    borderRadius: '1px',
                    bgcolor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      outline: '2px solid',
                      outlineColor: isSelected ? theme.palette.primary.main : 'transparent',
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  {!CONTROL_CONFIG[control.kind].is_placeholder ? (
                    <Box sx={{ position: 'relative', padding: '4px' }}>
                      <Input
                        value={
                          control.content == CONTROL_CONFIG[control.kind].content
                            ? `${t(control.content)} ${t('(edit here)')}`
                            : control.content
                        }
                        onChange={(e) => handleContentChange(control.id, e.target.value)}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (control && !CONTROL_CONFIG[control.kind].is_placeholder) {
                            setIsEditing(true);
                          }
                        }}
                        sx={{
                          fontSize: control.font_size,
                          textAlign: control.text_align,
                          width: 'calc(100% - 8px)',
                          position: 'relative',
                          zIndex: 1,
                          '& input': { textAlign: control.text_align, padding: '0 4px' },
                          cursor: isCurrentlyEditing ? 'text' : 'move',
                        }}
                        disableUnderline
                      />
                      {!isCurrentlyEditing
                        ? null
                        : isDragging && <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'move' }} />}
                    </Box>
                  ) : (
                    <span style={{ textAlign: control.text_align, cursor: 'move !important' }}>{t(control.content)}</span>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Paper>
      </Grid>
    </Grid>
  );
};
