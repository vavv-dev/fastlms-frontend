import { Box, SxProps } from '@mui/material';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import {
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButtonAddImage,
  MenuButtonBlockquote,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonEditLink,
  MenuButtonHighlightColor,
  MenuButtonHorizontalRule,
  MenuButtonIndent,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRemoveFormatting,
  MenuButtonStrikethrough,
  MenuButtonTextColor,
  MenuButtonUnindent,
  MenuControlsContainer,
  MenuSelectHeading,
  RichTextEditor,
  RichTextEditorRef,
} from 'mui-tiptap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageResize from 'tiptap-extension-resize-image';

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

const TextEditor = ({
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!rteRef.current?.editor || initialized || !initialValue) return;
    const content = initialValue.replace(/\n/g, '<br>');
    rteRef.current.editor.commands.setContent(content);
    setInitialized(true);
  }, [rteRef.current?.editor, initialValue]); // eslint-disable-line

  return (
    <Box
      sx={{
        '& .MuiTiptap-RichTextContent-root': { minHeight: minHeight, overflow: 'auto' },
        '& .MuiTiptap-MenuBar-root .MuiTiptap-RichTextField-content': { py: 0.5 },
        '& .MuiTiptap-RichTextContent-readonly': { opacity: 0.6 },
        '& .MuiTiptap-FieldContainer-root': { borderRadius: '8px' },
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
        }}
        onBlur={onBlur}
        editable={!disabled}
        RichTextFieldProps={{ disabled }}
        extensions={[
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
            <MenuButtonIndent tabIndex={-1} tooltipLabel={t('Indent')} />
            <MenuButtonUnindent tabIndex={-1} tooltipLabel={t('Unindent')} />
            <MenuButtonBulletedList tabIndex={-1} tooltipLabel={t('Bulleted list')} />
            <MenuButtonOrderedList tabIndex={-1} tooltipLabel={t('Ordered list')} />
            <MenuButtonAddImage
              tabIndex={-1}
              onClick={() => {
                const url = window.prompt(t('Enter the image URL'));
                if (url) {
                  rteRef.current?.editor?.chain().focus().setImage({ src: url }).run();
                }
              }}
              tooltipLabel={t('Insert image')}
            />
            <MenuButtonBlockquote tabIndex={-1} tooltipLabel={t('Blockquote')} />
            <MenuButtonHorizontalRule tabIndex={-1} tooltipLabel={t('Horizontal rule')} />
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
            <MenuButtonStrikethrough tabIndex={-1} tooltipLabel={t('Strikethrough')} />
            <Box flexGrow={1} />
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
    </Box>
  );
};

export default TextEditor;
