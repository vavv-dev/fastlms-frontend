import { accountUploadFiles } from '@/api';
import i18next from '@/i18n';
import { Box, FormHelperText, SxProps } from '@mui/material';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import TextStyle from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import {
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButtonAddTable,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCodeBlock,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonImageUpload,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonSubscript,
  MenuButtonSuperscript,
  MenuButtonTaskList,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
  RichTextEditorRef,
  TableImproved,
} from 'mui-tiptap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageResize from 'tiptap-extension-resize-image';
import * as yup from 'yup';
import { MenuButtonFileUpload } from './tiptap/MenuButtonFileUpload';

interface TextEditorProps {
  initialValue: string;
  placeholder?: string;
  borderColor?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  container?: HTMLElement | null;
  disabled?: boolean;
  minHeight?: string;
  sx?: SxProps;
}

const fileSchema = yup.array().of(
  yup.mixed<File>().test('fileSize', i18next.t('File size must be less than 5MB', { ns: 'common' }), (value) => {
    if (!value) return true;
    return value.size <= 5 * 1024 * 1024; // 5MB
  }),
);

export const TextEditor = ({
  initialValue,
  placeholder,
  borderColor,
  onChange,
  onBlur,
  container,
  minHeight = '80px',
  sx,
  disabled = false,
}: TextEditorProps) => {
  const { t } = useTranslation('common');
  const rteRef = useRef<RichTextEditorRef>(null);
  const [linkBubbleMenuOpen, setLinkBubbleMenuOpen] = useState(false);
  const linkBubbleMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        '& .MuiTiptap-RichTextField-content .MuiSelect-select': { width: '3em' },
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
          Subscript,
          Superscript,
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
          Placeholder.configure({ placeholder: placeholder || t('Type something...') }),
        ]}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuSelectHeading
              tabIndex={-1}
              inputProps={{ tabIndex: -1, focusable: false }}
              tooltipTitle={t('Text styles')}
              labels={{
                empty: t('Select a heading'),
                paragraph: t('Normal text'),
                heading1: t('Heading 1'),
                heading2: t('Heading 2'),
                heading3: t('Heading 3'),
                heading4: t('Heading 4'),
                heading5: t('Heading 5'),
                heading6: t('Heading 6'),
              }}
            />
            <MenuButtonBold tabIndex={-1} tooltipLabel={t('Bold')} />
            <MenuButtonItalic tabIndex={-1} tooltipLabel={t('Italic')} />
            <MenuButtonUnderline tabIndex={-1} tooltipLabel={t('Underline')} />
            <MenuButtonSuperscript tabIndex={-1} tooltipLabel={t('Superscript')} />
            <MenuButtonSubscript tabIndex={-1} tooltipLabel={t('Subscript')} />
            <MenuButtonStrikethrough tabIndex={-1} tooltipLabel={t('Strikethrough')} />
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
            <MenuButtonCodeBlock tabIndex={-1} tooltipLabel={t('Code block')} />
            <MenuButtonTaskList tabIndex={-1} tooltipLabel={t('Task list')} />

            <MenuDivider />
            <MenuButtonEditLink
              tabIndex={-1}
              onClick={() => {
                rteRef.current?.editor?.commands.openLinkBubbleMenu({
                  anchorEl: linkBubbleMenuButtonRef.current,
                  placement: 'bottom',
                });
                setLinkBubbleMenuOpen(true);
              }}
              buttonRef={linkBubbleMenuButtonRef}
              tooltipLabel={t('Link')}
            />
            <MenuButtonImageUpload tabIndex={-1} onUploadFiles={uploadFiles} tooltipLabel={t('Insert image')} />
            <MenuButtonFileUpload tabIndex={-1} onUploadFiles={uploadFiles} tooltipLabel={t('Insert file')} />
            <Box sx={{ flexGrow: 1 }} />
            <MenuButtonRemoveFormatting tabIndex={-1} tooltipLabel={t('Remove formatting')} />
          </MenuControlsContainer>
        )}
      >
        {() => (
          <>
            {linkBubbleMenuOpen && (
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
            )}
          </>
        )}
      </RichTextEditor>
      {uploadError && (
        <FormHelperText variant={'standard'} sx={{ color: 'error.main' }}>
          {uploadError}
        </FormHelperText>
      )}
    </Box>
  );
};
