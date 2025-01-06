import { FileUploadOutlined, InsertEmoticonOutlined } from '@mui/icons-material';
import { Box, FormHelperText, SxProps } from '@mui/material';
import type { Editor } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import TextStyle from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { EmojiClickData } from 'emoji-picker-react';
import {
  FontSize,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButton,
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonImageUpload,
  MenuButtonIndent,
  MenuButtonOrderedList,
  MenuButtonProps,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectFontSize,
  RichTextEditor,
  RichTextEditorRef,
  TableBubbleMenu,
  TableImproved,
  useRichTextEditorContext,
} from 'mui-tiptap';
import { ComponentPropsWithoutRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageResize from 'tiptap-extension-resize-image';
import type { SetOptional, SetRequired } from 'type-fest';
import * as yup from 'yup';

import { accountUploadFiles } from '@/api';
import { EmojiPickerWrapper } from '@/component/common';

interface TextEditorProps {
  initialValue: string;
  placeholder?: string;
  borderColor?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  container?: HTMLElement | null;
  disabled?: boolean;
  minHeight?: number;
  sx?: SxProps;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const createFileSchema = (t: (key: string, options?: { ns: string; size: number }) => string) =>
  yup.array().of(
    yup.mixed<File>().test(
      'fileSize',
      t('File size must be less than {{ size }}MB', {
        ns: 'common',
        size: MAX_FILE_SIZE / 1024 / 1024,
      }),
      (value) => {
        if (!value) return true;
        return value.size <= MAX_FILE_SIZE;
      },
    ),
  );

export const FullTextEditor = ({
  initialValue,
  placeholder,
  borderColor,
  onChange,
  onBlur,
  container,
  minHeight = 80,
  sx,
  disabled = false,
}: TextEditorProps) => {
  const { t } = useTranslation('common');
  const rteRef = useRef<RichTextEditorRef>(null);
  const [linkBubbleMenuOpen, setLinkBubbleMenuOpen] = useState(false);
  const linkBubbleMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileSchema = useMemo(() => createFileSchema(t), [t]);
  const uploadFiles = async (files: File[]) => {
    setUploadError(null);
    try {
      await fileSchema.validate(files);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setUploadError(error.message);
      }
      return [];
    }
    const urls = await accountUploadFiles({ formData: { files: files } });
    return urls.map((url) => ({ src: url, name: url.split('/').pop() || '' }));
  };

  useEffect(() => {
    if (!rteRef.current?.editor) return;
    if (initialValue == rteRef.current.editor.getHTML()) return;
    const content = initialValue.replace(/\n/g, '<br>');
    rteRef.current.editor.commands.setContent(content);
  }, [rteRef.current?.editor, initialValue]);

  return (
    <Box
      sx={{
        '& .MuiTiptap-RichTextContent-root': { minHeight: minHeight, overflow: 'auto' },
        '& .MuiTiptap-RichTextContent-root .tiptap p': { wordBreak: 'break-all' },
        '& .MuiTiptap-MenuBar-root .MuiTiptap-RichTextField-content': { py: 0.5 },
        '& .MuiTiptap-RichTextContent-readonly': { opacity: 0.6 },
        '& .MuiTiptap-FieldContainer-root': { borderRadius: '8px' },
        '& .MuiTiptap-RichTextField-menuBar': { position: 'inherit' },
        '& .MuiTiptap-FieldContainer-notchedOutline': {
          borderColor: borderColor ? `${borderColor} !important` : 'inherit',
        },
        ...(!disabled && {
          '&:hover .MuiTiptap-FieldContainer-notchedOutline': {
            borderWidth: '2px',
            transition: 'border-color 0.2s',
          },
          cursor: 'text',
        }),
        ...sx,
      }}
      onClick={() => rteRef.current?.editor?.chain().focus()}
    >
      <RichTextEditor
        ref={rteRef}
        content={initialValue}
        onUpdate={(props) => {
          const content = props.editor?.getHTML() || '';
          onChange(content.replace(/<p><\/p>/g, '') === '' ? '' : content);
          setUploadError(null);
        }}
        onBlur={onBlur}
        editable={!disabled}
        RichTextFieldProps={{ disabled }}
        extensions={[
          Underline,
          TableImproved.configure({ resizable: true }),
          TableRow,
          TableHeader,
          TableCell,
          TaskItem.configure({ nested: true }),
          TaskList,
          StarterKit,
          Color,
          TextStyle,
          Highlight,
          LinkBubbleMenuHandler,
          Link,
          ImageResize,
          Placeholder.configure({ placeholder: placeholder || t('Type something... you can insert images and files.') }),
          FontSize,
        ]}
        renderControls={() => (
          <MenuControlsContainer>
            <Box // fix select box flicking
              sx={{ height: 30, '& .MuiSelect-select': { height: 20, py: '5px', maxHeight: 20, minHeight: 20 } }}
            >
              <MenuSelectFontSize
                options={['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']}
                tabIndex={-1}
                tooltipTitle=""
                inputProps={{ tabIndex: -1, focusable: false }}
                unsetOptionLabel={t('Unset font size')}
              />
            </Box>
            <MenuButtonBold tabIndex={-1} tooltipLabel={t('Bold')} />
            <MenuButtonUnderline tabIndex={-1} tooltipLabel={t('Underline')} />
            <MenuButtonStrikethrough tabIndex={-1} tooltipLabel={t('Strikethrough')} />
            <MenuDivider />
            <MenuButtonTextColor
              tabIndex={-1}
              PopperProps={{ container }}
              ColorPickerProps={{ disableAlpha: true }}
              tooltipLabel={t('Text color')}
              labels={{
                cancelButton: t('Cancel'),
                saveButton: t('OK'),
                removeColorButton: t('Reset'),
              }}
            />
            <MenuButtonHighlightColor
              tabIndex={-1}
              PopperProps={{ container }}
              ColorPickerProps={{ disableAlpha: true }}
              tooltipLabel={t('Highlight color')}
              labels={{
                cancelButton: t('Cancel'),
                saveButton: t('OK'),
                removeColorButton: t('Reset'),
              }}
            />
            <MenuDivider />
            <MenuButtonIndent tabIndex={-1} tooltipLabel={t('Indent')} />
            <MenuButtonUnindent tabIndex={-1} tooltipLabel={t('Unindent')} />
            <MenuButtonBulletedList tabIndex={-1} tooltipLabel={t('Bulleted list')} />
            <MenuButtonOrderedList tabIndex={-1} tooltipLabel={t('Ordered list')} />
            <MenuDivider />
            <MenuButtonBlockquote tabIndex={-1} tooltipLabel={t('Blockquote')} />
            <MenuButtonHorizontalRule tabIndex={-1} tooltipLabel={t('Horizontal rule')} />
            <MenuDivider />

            <MenuButtonAddTable tabIndex={-1} tooltipLabel={t('Table')} />
            <MenuButtonTaskList tabIndex={-1} tooltipLabel={t('Task list')} />

            <MenuDivider />
            <MenuButtonEditLink
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                rteRef.current?.editor?.commands.openLinkBubbleMenu({
                  anchorEl: linkBubbleMenuButtonRef.current,
                  placement: 'bottom',
                });
                setLinkBubbleMenuOpen(true);
              }}
              buttonRef={linkBubbleMenuButtonRef as React.RefObject<HTMLButtonElement>}
              tooltipLabel={t('Link')}
            />
            <MenuButtonImageUpload tabIndex={-1} onUploadFiles={uploadFiles} tooltipLabel={t('Insert image')} />
            <MenuButtonFileUpload tabIndex={-1} onUploadFiles={uploadFiles} tooltipLabel={t('Insert file')} />
            <MenuButtonEmoji tabIndex={-1} />
            <Box sx={{ flexGrow: 1 }} />
            <MenuButtonRemoveFormatting tabIndex={-1} tooltipLabel={t('Remove formatting')} />
          </MenuControlsContainer>
        )}
      >
        {() => (
          <>
            {linkBubbleMenuOpen && (
              <Box onClick={(e) => e.stopPropagation()}>
                <LinkBubbleMenu
                  container={container}
                  anchorEl={linkBubbleMenuButtonRef.current}
                  labels={{
                    viewLinkEditButtonLabel: t('Edit'),
                    viewLinkRemoveButtonLabel: t('Remove'),
                    editLinkAddTitle: t('Add link'),
                    editLinkEditTitle: t('Edit link'),
                    editLinkTextInputLabel: t('Text'),
                    editLinkHrefInputLabel: t('Link URL'),
                    editLinkCancelButtonLabel: t('Cancel'),
                    editLinkSaveButtonLabel: t('Save'),
                  }}
                />
              </Box>
            )}
            <TableBubbleMenu
              labels={{
                insertColumnBefore: t('Insert column before'),
                insertColumnAfter: t('Insert column after'),
                deleteColumn: t('Delete column'),
                insertRowAbove: t('Insert row above'),
                insertRowBelow: t('Insert row below'),
                deleteRow: t('Delete row'),
                mergeCells: t('Merge cells'),
                splitCell: t('Split cell'),
                toggleHeaderRow: t('Toggle header row'),
                toggleHeaderColumn: t('Toggle header column'),
                toggleHeaderCell: t('Toggle header cell'),
                deleteTable: t('Delete table'),
              }}
            />
          </>
        )}
      </RichTextEditor>
      {uploadError && (
        <FormHelperText variant="standard" sx={{ color: 'error.main' }}>
          {uploadError}
        </FormHelperText>
      )}
    </Box>
  );
};

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

const MenuButtonFileUpload = ({ onUploadFiles, inputProps, ...props }: MenuButtonFileUploadProps) => {
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
};

type MenuButtonAddFileProps = SetRequired<Partial<MenuButtonProps>, 'onClick'>;

const MenuButtonAddFile = ({ ...props }: MenuButtonAddFileProps) => {
  const editor = useRichTextEditorContext();
  return (
    <MenuButton
      tooltipLabel="Insert file"
      IconComponent={FileUploadOutlined}
      disabled={!editor?.isEditable || !editor.can().setLink({ href: 'http://example.com' })}
      {...props}
    />
  );
};

const MenuButtonEmoji = (props: Partial<MenuButtonProps>) => {
  const { t } = useTranslation('common');
  const editor = useRichTextEditorContext();
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const insertEmoji = (emojiData: EmojiClickData) => {
    if (!editor || editor.isDestroyed) return;
    editor.chain().focus().insertContent(emojiData.emoji).run();
  };

  return (
    <>
      <MenuButton
        onClick={() => setShowPicker(!showPicker)}
        tooltipLabel={t('Insert emoji')}
        IconComponent={InsertEmoticonOutlined}
        buttonRef={buttonRef as React.RefObject<HTMLButtonElement>}
        disabled={!editor?.isEditable}
        {...props}
      />
      <EmojiPickerWrapper
        insertEmoji={insertEmoji}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        emojiButtonRef={buttonRef}
      />
    </>
  );
};
