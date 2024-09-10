import { FileUploadOutlined } from '@mui/icons-material';
import type { Editor } from '@tiptap/core';
import { MenuButton, useRichTextEditorContext, type MenuButtonProps } from 'mui-tiptap';
import { useRef, type ComponentPropsWithoutRef } from 'react';
import type { SetOptional, SetRequired } from 'type-fest';

interface FileInfo {
  src: string;
  name: string;
}

interface MenuButtonFileUploadProps extends SetOptional<MenuButtonAddFileProps, 'onClick'> {
  onUploadFiles: (files: File[]) => FileInfo[] | Promise<FileInfo[]>;
  inputProps?: Partial<ComponentPropsWithoutRef<'input'>>;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'application/zip',
];

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.zip',
];

export function MenuButtonFileUpload({ onUploadFiles, inputProps, ...props }: MenuButtonFileUploadProps) {
  const editor = useRichTextEditorContext();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const insertFileLinks = ({ files, editor }: { files: FileInfo[]; editor: Editor | null }) => {
    if (!editor) return;
    files.forEach(({ src, name }) => {
      editor.chain().focus().setLink({ href: src }).insertContent(` ${name} `).run();
    });
  };

  const isFileTypeAllowed = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_FILE_EXTENSIONS.includes(fileExtension);
  };

  const handleAndInsertNewFiles = async (files: FileList) => {
    if (!editor || editor.isDestroyed || files.length === 0) {
      return;
    }
    const allowedFiles = Array.from(files).filter(isFileTypeAllowed);
    if (allowedFiles.length !== files.length) {
      console.warn(`${files.length - allowedFiles.length} file(s) were not allowed and will be ignored.`);
    }
    const fileInfos = await onUploadFiles(allowedFiles);
    insertFileLinks({
      editor,
      files: fileInfos,
    });
  };

  return (
    <>
      <MenuButtonAddFile tooltipLabel="Upload files" onClick={() => fileInput.current?.click()} {...props} />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ALLOWED_FILE_EXTENSIONS.join(',')}
        onChange={async (event) => {
          if (event.target.files) {
            await handleAndInsertNewFiles(event.target.files);
          }
          event.target.value = '';
        }}
        style={{ display: 'none' }}
        {...inputProps}
      />
    </>
  );
}

type MenuButtonAddFileProps = SetRequired<Partial<MenuButtonProps>, 'onClick'>;

function MenuButtonAddFile({ ...props }: MenuButtonAddFileProps) {
  const editor = useRichTextEditorContext();
  return (
    <MenuButton
      tooltipLabel="Insert file"
      IconComponent={FileUploadOutlined}
      disabled={!editor?.isEditable || !editor.can().setLink({ href: 'http://example.com' })}
      {...props}
    />
  );
}
