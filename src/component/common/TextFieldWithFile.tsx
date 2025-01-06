import { Close, FileUploadOutlined } from '@mui/icons-material';
import { Box, TextField, TextFieldProps, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toFixedHuman } from '@/helper/util';

type TextFieldWithFileProps = TextFieldProps & {
  attachedFiles: File[];
  setAttachedFiles: (files: File[]) => void;
};

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const TextFieldWithFile = ({ attachedFiles, setAttachedFiles, sx, ...textFieldProps }: TextFieldWithFileProps) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const getTotalSize = (files: File[]) => {
    return files.reduce((sum, file) => sum + file.size, 0);
  };

  const validateFiles = useCallback(
    (filesToValidate: File[], isNewFiles: boolean = false) => {
      const invalidTypeFiles = filesToValidate.filter((file) => !ACCEPTED_FILE_TYPES.includes(file.type));
      if (invalidTypeFiles.length > 0) {
        setError(t('Unsupported file type. Only PDF, TXT, images, and Office docs are allowed.'));
        return false;
      }

      const filesToCheck = isNewFiles ? [...attachedFiles, ...filesToValidate] : filesToValidate;
      const totalSize = getTotalSize(filesToCheck);

      if (totalSize > MAX_FILE_SIZE) {
        setError(t('Total file size exceeds {{size}}MB limit', { size: MAX_FILE_SIZE / 1024 / 1024 }));
        return false;
      }

      setError(null);
      return true;
    },
    [attachedFiles, t],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      if (validateFiles(files, true)) {
        const newFiles = files.filter((file) => !attachedFiles.some((f) => f.name === file.name));
        setAttachedFiles([...attachedFiles, ...newFiles]);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    const newFiles = attachedFiles.filter((f) => f.name !== fileName);
    if (validateFiles(newFiles, false)) {
      setAttachedFiles(newFiles);
    }
  };

  return (
    <Box
      sx={{ width: '100%' }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <Box sx={{ position: 'relative' }}>
        <TextField
          {...textFieldProps}
          error={!!error}
          sx={{
            ...sx,
            ...(isDragging && {
              '& .MuiOutlinedInput-root': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              },
            }),
          }}
          placeholder={textFieldProps.placeholder || t('Type a message... Shift + Enter for new line')}
          helperText={null}
        />
        {isDragging && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
              borderRadius: 1,
              zIndex: 1,
              pointerEvents: 'none',
              gap: 1,
            }}
          >
            <FileUploadOutlined />
            <Typography color="primary" variant="body2">
              {t('Drop files here')}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography
        variant="caption"
        color={error || textFieldProps.error ? 'error' : 'text.secondary'}
        sx={{ display: 'block', mt: 0.5 }}
      >
        {error || textFieldProps.error
          ? error || textFieldProps.helperText
          : t('You can attach pdf, txt, images, Office docs files up to {{size}}MB. Drag and drop files here.', {
              size: MAX_FILE_SIZE / 1024 / 1024,
            })}
      </Typography>

      {attachedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
          {attachedFiles.map((file) => (
            <Typography
              key={file.name}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {file.name} ({toFixedHuman(file.size / 1024 / 1024, 1)}MB)
              <Close
                sx={{ fontSize: theme.typography.caption.fontSize, cursor: 'pointer', color: 'error.main' }}
                onClick={() => handleRemoveFile(file.name)}
              />
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};
