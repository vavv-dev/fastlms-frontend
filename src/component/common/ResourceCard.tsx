import { WithAvatar, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { decodeURLText, generateRandomDarkColor, stripHtml, textEllipsisCss } from '@/helper/util';
import { ArrowRight, BookmarkBorderOutlined } from '@mui/icons-material';
import { Box, BoxProps, Button, LinearProgress, Stack, Tooltip, Typography, darken, useTheme } from '@mui/material';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ResourceUpdateField {
  is_public: boolean;
}

interface Resource extends ResourceUpdateField {
  id: string;
  title: string;
  description?: string;
  bookmarked: boolean;
  owner: {
    name: string;
    username: string;
    thumbnail?: string | null;
  };
}

interface Props {
  resource: Resource;
  onClick?: (e: React.MouseEvent) => void;
  banner?: React.ReactNode;
  bannerPlace?: 'top' | 'bottom';
  score?: number | null;
  passed?: boolean | null;
  avatarChildren?: React.ReactNode[];
  hideAvatar?: boolean;
  autoColor?: boolean;
  actionMenu?: React.ReactNode;
  footer?: React.ReactNode;
  sx?: BoxProps['sx'];
  showDescription?: boolean;
  bannerBorder?: boolean;
  partialUpdateService?: (params: { id: string; requestBody: Partial<ResourceUpdateField> }) => Promise<any>; // eslint-disable-line
  listService?: () => Promise<any>; // eslint-disable-line
}

export const ResourceCard = ({
  resource,
  onClick,
  banner,
  bannerPlace = 'top',
  avatarChildren,
  hideAvatar,
  autoColor,
  actionMenu,
  score,
  passed,
  footer,
  sx,
  showDescription,
  bannerBorder,
  partialUpdateService,
  listService,
}: Props) => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const color = autoColor ? generateRandomDarkColor(resource.title, 1, 0.1) : theme.palette.action.selected;
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  // Fix  with hovering
  useFixMouseLeave(cardRef, () => {
    setHover(false);
  });

  const updateField = useCallback(
    async (params: Partial<ResourceUpdateField>) => {
      if (partialUpdateService && listService) {
        await partialUpdateService({
          id: resource.id,
          requestBody: params,
        }).then(() => {
          updateInfiniteCache(listService, { id: resource.id, is_public: true }, 'update');
        });
      }
    },
    [partialUpdateService, resource.id, listService],
  );

  const Banner = useMemo(
    () =>
      !banner ? null : (
        <Box
          className="card-banner"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: color,
            border: bannerBorder ? `1px solid ${darken(color, 0.5)}` : 'none',
            position: 'relative',
            borderRadius: theme.shape.borderRadius / 2,
            gap: 1.5,
            overflow: 'hidden',
          }}
        >
          {banner}
          <Box
            sx={{
              pointerEvents: 'none',
              position: 'absolute',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: 'inherit',
            }}
          >
            {(score != null || score != undefined) && (
              <LinearProgress
                variant="determinate"
                value={score}
                sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', bgcolor: 'action.disalbedBackground' }}
                color={passed ? 'success' : 'warning'}
              />
            )}
            {!resource.is_public && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  zIndex: 3,
                  p: 1,
                  pointerEvents: 'auto',
                }}
              >
                <Tooltip title={t('If you change to public, everyone can see this resource.')}>
                  <Button
                    size="small"
                    sx={{ color: 'white', p: 0 }}
                    onClick={(e) => {
                      if (partialUpdateService) {
                        e.stopPropagation();
                        updateField({ is_public: true });
                      }
                    }}
                    endIcon={<ArrowRight />}
                  >
                    {t('Change to public')}
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      ),
    [
      banner,
      color,
      passed,
      resource.is_public,
      score,
      t,
      theme.shape.borderRadius,
      updateField,
      partialUpdateService,
      bannerBorder,
    ],
  );

  return (
    <Box
      ref={cardRef}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={(e) => {
        if (e.relatedTarget == window) return;
        setHover(false);
      }}
      sx={{
        cursor: onClick && 'pointer',
        display: 'flex',
        gap: 1,
        '& .card-content': {
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          width: '100%',
        },
        flexDirection: 'column',
        ...sx,
      }}
    >
      {bannerPlace === 'top' && Banner}
      <Box className="card-content">
        <Typography
          className="content-title"
          variant="subtitle2"
          sx={{ fontWeight: '600', my: 0.5, pr: '3px', lineHeight: 1.3, ...textEllipsisCss(2) }}
        >
          {resource.title}
        </Typography>
        <WithAvatar
          name={resource.owner.name}
          username={resource.owner.username}
          thumbnail={resource.owner.thumbnail}
          hideAvatar={hideAvatar}
          sx={bannerPlace === 'bottom' ? { flexGrow: 0, mb: 1 } : {}}
        >
          <Stack sx={{ color: 'text.secondary' }} direction="row" spacing={1}>
            {avatarChildren?.map((child, i) => (
              <Typography key={i} component="div" variant="caption">
                {child}
              </Typography>
            ))}
            {resource.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
          </Stack>
          <Box sx={{ display: !hover ? 'none' : 'block', position: 'absolute', right: 0 }}>{actionMenu}</Box>
        </WithAvatar>
        {showDescription && (
          <Typography variant="body2" sx={{ color: 'text.secondary', ...textEllipsisCss(2) }}>
            {stripHtml(decodeURLText(resource.description))}
          </Typography>
        )}
      </Box>
      {bannerPlace === 'bottom' && Banner}
      {footer}
    </Box>
  );
};
