import { ArrowDownward, Close, DeleteOutlined, LiveHelpOutlined, Send } from '@mui/icons-material';
import { Box, Drawer, IconButton, Menu, MenuItem, Typography, alpha, useTheme } from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageBubble } from './MessageBubble';

import {
  AssistantGetMessagesData as GetMessagesData,
  AssistantGetMessagesResponse as GetMessagesResponse,
  MessageRequest as Request,
  MessageResponse as Response,
  assistantDeleteAllMessages as deleteAllMessages,
  assistantGetMessages as getMessages,
  assistantSendMessage as sendMessage,
} from '@/api';
import {
  InfiniteScrollIndicator,
  SimpleSearch,
  TextFieldWithFile,
  updateInfiniteCache,
  useInfinitePagination,
} from '@/component/common';
import { formatDatetimeLocale, textEllipsisCss } from '@/helper/util';
import { userState } from '@/store';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const widthState = atom<number>(430);
const searchState = atom<string>('');
// fix editor syntax highlighting by 'as Set<string>'
const contextState = atom<Set<string>>(new Set() as Set<string>);

const AI_CHAT_ENABLED = import.meta.env.VITE_AI_CHAT_ENABLED == 'true';

export const ChatDrawer = ({ open, onClose }: ChatDrawerProps) => {
  const { t } = useTranslation('chat');
  const theme = useTheme();
  const user = useAtomValue(userState);
  const [width, setWidth] = useAtom(widthState);
  const [isDragging, setIsDragging] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [waiting, setWaiting] = useState<Response | null>(null);
  const [deleteAllAnchorEl, setDeleteAllAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useAtom(searchState);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const infiniteScrollRef = useRef<HTMLDivElement | null>(null);
  const {
    data: messages,
    mutate: messagesMutate,
    isLoading,
    isValidating,
  } = useInfinitePagination<GetMessagesData, GetMessagesResponse>({
    apiOptions: { orderBy: 'created', search },
    apiService: getMessages,
    infiniteScrollRef,
  });

  const [context, setContext] = useAtom(contextState);
  const [input, setInput] = useState('');
  const { scrollContainerRef, updateScroll, initializeScroll } = useScrollPreservation();

  useEffect(() => {
    updateScroll();
  }, [messages, updateScroll]);

  useEffect(() => {
    initializeScroll();
  }, [initializeScroll]);

  const showDeleteAll = (e: React.MouseEvent<HTMLElement>) => {
    setDeleteAllAnchorEl(deleteAllAnchorEl ? null : e.currentTarget);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollButton(container.scrollTop < -100);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []); // eslint-disable-line

  const handleDeleteAll = () => {
    deleteAllMessages().then(() => {
      setContext(new Set());
      setDeleteAllAnchorEl(null);
      messagesMutate((prev) => prev && [{ ...prev?.[0], items: [], total: 0 }], { revalidate: false });
    });
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startX = e.pageX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = startWidth + (startX - e.pageX);
        setWidth(Math.min(Math.max(300, newWidth), 800));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, setWidth],
  );

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [scrollContainerRef]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;

    scrollToBottom();

    const newMessage: Request = {
      content: input.trim(),
      meta: { context: [...Array.from(context), window.location.pathname] },
      location: window.location.href,
    };

    // show optimistic ui
    setWaiting({
      ...newMessage,
      id: '',
      role: 'user',
      meta: {},
      created: new Date().toISOString(),
    });

    // reset
    setInput('');
    setAttachedFiles([]);

    sendMessage({ requestBody: newMessage }).then((newMessages) => {
      setContext((prev) => {
        const newContext = new Set(prev);
        newMessages.forEach((message) => newContext.add(message.id));
        return newContext;
      });

      newMessages.reverse().forEach((message) => {
        updateInfiniteCache<Response>(getMessages, message, 'create');
      });

      // clear waiting state
      setWaiting(null);
    });
  }, [context, input, isLoading, setContext, scrollToBottom]);

  const memoizedMessages = useMemo(() => messages?.flatMap((page) => page.items) || [], [messages]);

  if (!AI_CHAT_ENABLED) return null;
  if (!user) return null;

  return (
    <>
      {/* Resize Handle */}
      {open && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'fixed',
            left: `calc(100% - ${width}px - 8px)`,
            top: '8px',
            bottom: '8px',
            width: '4px',
            cursor: 'ew-resize',
            zIndex: theme.zIndex.drawer + 102,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
            ...(isDragging && {
              cursor: 'ew-resize',
              userSelect: 'none',
            }),
          }}
        />
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="persistent"
        sx={{
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            maxWidth: 'calc(100% - 16px)',
            width,
            boxSizing: 'border-box',
            boxShadow: (theme) => theme.shadows[8],
            margin: '8px',
            height: 'calc(100% - 16px)',
            borderRadius: 3,
            zIndex: theme.zIndex.drawer + 101,
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            ...(isDragging && { userSelect: 'none', pointerEvents: 'none' }),
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 1,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LiveHelpOutlined />
              <Typography variant="subtitle1" sx={{ ...textEllipsisCss(1) }}>
                {t('AI help')}
              </Typography>
            </Box>
            <SimpleSearch search={search} setSearch={setSearch} />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {showScrollButton && (
                <IconButton size="small" sx={{}} onClick={scrollToBottom}>
                  <ArrowDownward fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={showDeleteAll} disabled={memoizedMessages.length === 0}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={deleteAllAnchorEl}
                open={Boolean(deleteAllAnchorEl)}
                onClose={() => setDeleteAllAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ zIndex: theme.zIndex.drawer + 103 }}
              >
                <MenuItem onClick={handleDeleteAll}>
                  <Typography variant="body2" color="error">
                    {t('Delete all messages')}
                  </Typography>
                </MenuItem>
              </Menu>
              <IconButton size="small" onClick={onClose}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            ref={scrollContainerRef}
            sx={{
              flexGrow: 1,
              p: 2,
              pt: '3em',
              overflow: 'auto',
              bgcolor: alpha(theme.palette.action.hover, 0.02),
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: 3,
              scrollbarWidth: 'none',
              overscrollBehavior: 'contain',
              '&::-webkit-scrollbar': { display: 'none' },
              willChange: 'transform',
              WebkitOverflowScrolling: 'touch',
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            {waiting && <MessageBubble message={waiting} context={context} setContext={setContext} waiting />}
            {memoizedMessages.length > 0 &&
              (() => {
                let currentDate = '';
                return memoizedMessages.map((message) => {
                  const messageDate = new Date(message.created).toLocaleDateString();
                  let dateSeparator = null;
                  if (messageDate !== currentDate) {
                    currentDate = messageDate;
                    dateSeparator = <DateSeparator key={`date-${messageDate}`} date={message.created} />;
                  }
                  return (
                    <Box key={message.id}>
                      <MessageBubble message={message} context={context} setContext={setContext} />
                      {dateSeparator}
                    </Box>
                  );
                });
              })()}
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              <span>{t('Ask me anything!')}</span>
              <span>
                {t(
                  'The AI assistant can answer questions about any content on this site and provide help with site navigation.',
                )}
              </span>
            </Typography>

            <InfiniteScrollIndicator ref={infiniteScrollRef} show={isLoading || isValidating} small />
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <TextFieldWithFile
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              fullWidth
              multiline
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isComposing) {
                    handleSend();
                  }
                }
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton onClick={handleSend} disabled={!input.trim() || isLoading || isValidating} color="primary">
                      <Send />
                    </IconButton>
                  ),
                },
              }}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
            />
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

const DateSeparator = memo(({ date }: { date: string }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        my: 2,
      }}
    >
      <Box sx={{ flex: 1, height: '1px', bgcolor: theme.palette.divider }} />
      <Typography variant="caption" color="text.secondary">
        {formatDatetimeLocale(date)}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: theme.palette.divider }} />
    </Box>
  );
});

const scrollPositionState = atom<number>(0);

const useScrollPreservation = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const [scrollPosition, setScrollPosition] = useAtom(scrollPositionState);

  const updateScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;

      if (prevScrollHeightRef.current > 0) {
        container.scrollTop = container.scrollTop + scrollDiff;
      }
      prevScrollHeightRef.current = newScrollHeight;
      setScrollPosition(container.scrollTop);
    }
  }, [setScrollPosition]);

  const initializeScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      prevScrollHeightRef.current = container.scrollHeight;
      if (scrollPosition > 0) {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = scrollPosition;
          }
        });
      }
    }
  }, [scrollPosition]);

  return {
    scrollContainerRef,
    updateScroll,
    initializeScroll,
  };
};
