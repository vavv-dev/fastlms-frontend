import { contentPresignedUploadUrl } from '@/api';
import i18next from '@/i18n';
import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

const t = (key: string, option?: Record<string, string | number>) => i18next.t(key, { ...option, ns: 'common' });

const uppyLocale = {
  pluralize: (num: number) => (num === 1 ? 0 : 1),
  strings: {
    addingMoreFiles: t('Adding more files'),
    addMore: t('Add more'),
    addMoreFiles: t('Add more files'),
    back: 'Back',
    browseFiles: t('browse files'),
    cancel: t('Cancel'),
    complete: t('Complete'),
    done: t('Done'),
    dropPasteFiles: t('Drop files here or %{browseFiles}'),
    noDuplicates: t("Cannot add the duplicate file '%{fileName}', it already exists"),
    removeFile: t('Remove file'),
    uploadComplete: t('Upload complete'),
    uploadXFiles: {
      '0': t('Upload %{smart_count} file'),
      '1': t('Upload %{smart_count} files'),
    },
    xFilesSelected: {
      '0': t('%{smart_count} file selected'),
      '1': t('%{smart_count} files selected'),
    },
    exceedsSize: t('%{file} exceeds maximum allowed size of %{size}'),
    // closeModal: 'Close Modal',
    // importFrom: 'Import from %{name}',
    // dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
    // dashboardTitle: 'Uppy Dashboard',
    // copyLinkToClipboardSuccess: 'Link copied to clipboard.',
    // copyLinkToClipboardFallback: 'Copy the URL below',
    // copyLink: 'Copy link',
    // editFile: 'Edit file',
    // editing: 'Editing %{file}',
    // finishEditingFile: 'Finish editing file',
    // saveChanges: 'Save changes',
    // myDevice: 'My Device',
    dropHint: t('Drop your files here'),
    // uploadPaused: 'Upload paused',
    // resumeUpload: 'Resume upload',
    // pauseUpload: 'Pause upload',
    retryUpload: t('Retry upload'),
    // cancelUpload: 'Cancel upload',
    // uploadingXFiles: {
    //   0: 'Uploading %{smart_count} file',
    //   1: 'Uploading %{smart_count} files',
    // },
    // processingXFiles: {
    //   0: 'Processing %{smart_count} file',
    //   1: 'Processing %{smart_count} files',
    // },
    // poweredBy: 'Powered by %{uppy}',
    // editFileWithFilename: 'Edit file %{file}',
    // save: 'Save',
    // dropPasteFolders: 'Drop files here or %{browseFolders}',
    // dropPasteBoth: 'Drop files here, %{browseFiles} or %{browseFolders}',
    // dropPasteImportFiles: 'Drop files here, %{browseFiles} or import from:',
    // dropPasteImportFolders: 'Drop files here, %{browseFolders} or import from:',
    // dropPasteImportBoth: 'Drop files here, %{browseFiles}, %{browseFolders} or import from:',
    // importFiles: 'Import files from:',
    // browseFolders: 'browse folders',
    // recoveredXFiles: {
    //   0: 'We could not fully recover 1 file. Please re-select it and resume the upload.',
    //   1: 'We could not fully recover %{smart_count} files. Please re-select them and resume the upload.',
    // },
    // recoveredAllFiles: 'We restored all files. You can now resume the upload.',
    // sessionRestored: 'Session restored',
    // reSelect: 'Re-select',
    // missingRequiredMetaFields: {
    //   0: 'Missing required meta field: %{fields}.',
    //   1: 'Missing required meta fields: %{fields}.',
    // },
  },
};

const CONTENT_MAX_SIZE_MB = import.meta.env.VITE_CONTENT_MAX_SIZE_MB;
const CONTENT_MAX_SIZE = parseInt(CONTENT_MAX_SIZE_MB || '200') * 1024 * 1024; // 200MB
const CONTENT_SIZE_LIMIT_MB = import.meta.env.VITE_CONTENT_SIZE_LIMIT_MB;
const CONTENT_SIZE_LIMIT = parseInt(CONTENT_SIZE_LIMIT_MB || '1024') * 1024 * 1024; // 1GB

// upload state
const createUppy = (contentId: string) => {
  const uppy = new Uppy({
    locale: uppyLocale,
    autoProceed: false,
    restrictions: {
      maxFileSize: CONTENT_MAX_SIZE,
      maxNumberOfFiles: null,
      allowedFileTypes: ['*/*'],
    },
    onBeforeFileAdded: (file) => {
      const totalSize = uppy.getFiles().reduce((total, f) => total + (f.size || 0), 0);
      const newTotalSize = totalSize + (file.size || 0);
      if (newTotalSize > CONTENT_SIZE_LIMIT) {
        uppy.info(
          t(`The total size of the files exceeds the limit of {{ max }}MB.`, { max: CONTENT_SIZE_LIMIT_MB }),
          'error',
          5000,
        );
        return false;
      }

      // set relativePath
      file.meta = {
        ...file.meta,
        relativePath: file.meta.relativePath || file.meta.webkitRelativePath || file.name,
      };

      return true;
    },
  }).use(AwsS3, {
    endpoint: '',
    shouldUseMultipart(file) {
      // TODO not ready yet for multipart presigned upload
      // return (file.size || 0) > 1024 * 1024 * 100; // 100MB
      void file;
      return false;
    },

    async getUploadParameters(file) {
      const response = await contentPresignedUploadUrl({
        contentId,
        // use relativePath for the filename
        filename: (file.meta.relativePath || file.meta.webkitRelativePath || file.name) as string,
        contentType: file.type,
      });

      return {
        method: 'PUT',
        url: response,
        headers: { 'Content-Type': file.type },
      };
    },
  });

  return uppy;
};
export const uppyFamily = atomFamily((id: string) => atom<Uppy>(() => createUppy(id)));
