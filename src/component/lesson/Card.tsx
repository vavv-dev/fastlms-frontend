import {
  AssetDisplayResponse,
  LessonDisplayResponse as DisplayResponse,
  ExamDisplayResponse,
  QuizDisplayResponse,
  SurveyDisplayResponse,
  VideoDisplayResponse,
  lessonGetDisplays as getDisplays,
  lessonUpdateResource as updateResource,
} from '@/api';
import { AssetCard } from '@/component/asset';
import { WithAvatar, updateInfiniteCache, useFixMouseLeave } from '@/component/common';
import { ExamCard } from '@/component/exam';
import { QuizCard } from '@/component/quiz';
import { SurveyCard } from '@/component/survey';
import { VideoCard } from '@/component/video';
import { decodeURLText, formatRelativeTime, toFixedHuman } from '@/helper/util';
import { ArrowRight, BookmarkBorderOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from './ActionMenu';

interface Props {
  data: DisplayResponse;
  hideAvatar?: boolean;
  embeded?: boolean;
  borderBox?: boolean;
}

export const Card = ({ data, hideAvatar, embeded, borderBox = true }: Props) => {
  const { t } = useTranslation('lesson');
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  // Fix  with hovering
  useFixMouseLeave(cardRef, () => {
    setHover(false);
  });

  const toPublic = async () => {
    await updateResource({
      id: data.id,
      requestBody: { is_public: true },
    }).then(() => {
      updateInfiniteCache<DisplayResponse>(getDisplays, { id: data.id, is_public: true }, 'update');
    });
  };

  return (
    <Box
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={(e) => {
        if (e.relatedTarget == window) return;
        setHover(false);
      }}
      sx={{
        display: 'flex',
        gap: 3,
        flexDirection: 'column',
        position: 'relative',
        pb: 2,
        ...(borderBox && {
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          p: { xs: 2, sm: 3 },
        }),
      }}
    >
      {!data.is_public && (
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            zIndex: 3,
            p: 1,
            borderRadius: theme.shape.borderRadius / 2,
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'none' },
            '& .MuiButton-root': { pointerEvents: 'auto' },
          }}
        >
          <Button
            size="small"
            sx={{ color: 'white', p: 0 }}
            endIcon={<ArrowRight />}
            onClick={(e) => {
              e.stopPropagation();
              toPublic();
            }}
          >
            {t('Change to public')}
          </Button>
        </Box>
      )}

      <WithAvatar {...data.owner} hideAvatar={hideAvatar}>
        <Stack sx={{ color: 'text.secondary', alignItems: 'center', pr: '3em' }} direction="row" spacing={2}>
          <Typography variant="subtitle2">{t(...formatRelativeTime(data.modified))}</Typography>
          {data.bookmarked && <BookmarkBorderOutlined fontSize="small" />}
          {data.grading_method == 'score' && (
            <>
              <LinearProgress
                color={data.passed ? 'success' : 'warning'}
                variant="determinate"
                value={data.score || 0}
                sx={{ width: '100px', flexGrow: 1 }}
              />
              <Typography variant="subtitle2">{t('Score {{ value }}', { value: toFixedHuman(data.score, 1) })}</Typography>
            </>
          )}
          {data.grading_method == 'progress' && (
            <>
              <LinearProgress
                color={data.passed ? 'success' : 'warning'}
                variant="determinate"
                value={data.progress || 0}
                sx={{ width: '100px', flexGrow: 1 }}
              />
              <Typography variant="subtitle2">
                {t('Progress {{ value }} %', { value: toFixedHuman(data.progress, 1) })}
              </Typography>
            </>
          )}
        </Stack>
        <Box sx={{ visibility: !hover ? 'hidden' : 'visible', position: 'absolute', right: '-8px' }}>
          <ActionMenu data={data} />
        </Box>
      </WithAvatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gap: '2em 1em',
            justifyContent: 'center',
            gridTemplateColumns: {
              xs: 'repeat(1, 344px)',
              sm: 'repeat(2, 251px)',
              md: 'repeat(auto-fill, minmax(251px, 285px))',
            },
          }}
        >
          {!embeded && (
            <Box
              sx={{
                gridColumn: { xs: '1 / -1' },
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {data.thumbnail && (
                <Box
                  sx={{
                    width: '100px',
                    aspectRatio: '16 / 9',
                    backgroundImage: `url(${data.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: theme.shape.borderRadius / 2,
                  }}
                />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ fontWeight: '600', lineHeight: 1.2 }}>
                  {data.title}
                </Typography>
              </Box>
            </Box>
          )}

          {data.resources.map((resource) => (
            <Box key={resource.id}>
              <ResourceCard resource={resource} resourceDisplays={data.resource_displays} />
            </Box>
          ))}
          {data.description && (
            <Box
              className="tiptap-content"
              dangerouslySetInnerHTML={{ __html: decodeURLText(data.description) }}
              sx={{ gridColumn: { xs: '1 / -1' }, pr: 3, whiteSpace: 'pre-wrap', '& p': { my: 0 } }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface ResourceCardProps {
  resource: DisplayResponse['resources'][0];
  resourceDisplays: DisplayResponse['resource_displays'];
}

const ResourceCard = ({ resource, resourceDisplays }: ResourceCardProps) => {
  const { t } = useTranslation('lesson');
  const theme = useTheme();

  const SimpleCard = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          sx={{
            backgroundImage: `url(${resource.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            aspectRatio: '16 / 9',
            borderRadius: theme.shape.borderRadius / 2,
            bgcolor: 'action.hover',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>
            [{t(resource.kind)}]
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>
            {resource.title}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          {t('After refresh, the resource will be displayed.')}
        </Typography>
      </Box>
    );
  };

  const display = resourceDisplays?.find((display) => display.id === resource.id);

  if (!display) return <SimpleCard />;

  switch (display.kind) {
    case 'video':
      return <VideoCard data={{ ...(display as VideoDisplayResponse), video_kind: 'video' }} hideAvatar />;
    case 'asset':
      return <AssetCard data={{ ...(display as AssetDisplayResponse) }} hideAvatar />;
    case 'quiz':
      return <QuizCard data={display as QuizDisplayResponse} hideAvatar />;
    case 'survey':
      return <SurveyCard data={display as SurveyDisplayResponse} hideAvatar />;
    case 'exam':
      return <ExamCard data={display as ExamDisplayResponse} bannerPlace="top" hideAvatar />;
    default:
  }
};
