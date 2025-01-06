import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Box, Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, Switch, SxProps, TextField } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { playerInstanceState, playerProgressState, playerReadyState } from '.';

import {
  VideoGetSubtitlesData as GetSubtitlesData,
  VideoGetSubtitlesResponse as GetSubtitlesResponse,
  VideoGetViewData as GetViewData,
  VideoGetViewResponse as GetViewResponse,
  videoGetSubtitles as getSubtitles,
  videoGetView as getView,
} from '@/api';
import { useServiceImmutable } from '@/component/common';
import { getRegExp } from '@/helper/search';
import { formatDuration, parseLocalStorage } from '@/helper/util';

const _subtitleConfig = parseLocalStorage(`subtitleConfig`, { enabled: true, autoScroll: false });
const subtitleConfigState = atomWithStorage<{
  enabled: boolean;
  autoScroll: boolean;
}>('subtitleConfig', _subtitleConfig);

interface Cue {
  startTime: number;
  text: string;
}

export const Subtitle = ({ id, sx }: { id: string; sx?: SxProps }) => {
  const { t } = useTranslation('video');
  const [config, setConfig] = useAtom(subtitleConfigState);
  const playerProgress = useAtomValue(playerProgressState);
  const playerInstance = useAtomValue(playerInstanceState);
  const ready = useAtomValue(playerReadyState);
  const [langs, setLangs] = useState<Record<string, boolean>>({});
  const { data } = useServiceImmutable<GetViewData, GetViewResponse>(getView, { id });
  const { data: subtitles } = useServiceImmutable<GetSubtitlesData, GetSubtitlesResponse>(getSubtitles, { id });

  const tracksRef = useRef<Record<number, Record<string, string>>>({});
  const cuelineRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef<boolean>(config.autoScroll);

  // text search
  const searchText = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!cuelineRef.current) return;

    let pattern: string | RegExp = e.currentTarget.value.replace(/\s/g, '');
    if (pattern) {
      pattern = getRegExp(pattern, {
        ignoreSpace: true,
        ignoreCase: true,
        global: true,
      });
    }

    Array.from(cuelineRef.current.children).forEach((currentLine) => {
      if (!(currentLine instanceof HTMLElement)) return;

      setTimeout(() => {
        let matched = false;
        currentLine.querySelectorAll('.text').forEach((textEl) => {
          // initialize
          let text = textEl.innerHTML.replace(/<\/?mark>/g, '');
          if (pattern) {
            if (text.match(pattern)) {
              // highlight
              matched = true;
              text = text.replace(pattern, (matched: string) => `<mark>${matched}</mark>`);
            }
          }
          textEl.innerHTML = text;
        });

        if (!pattern) matched = true;
        currentLine.style.display = matched ? 'flex' : 'none';
      }, 0);
    });
  };

  // hide youtube captions
  useEffect(() => {
    setTimeout(() => {
      playerInstance?.getInternalPlayer()?.unloadModule?.('captions');
    }, 500);
  }, [ready]); // eslint-disable-line

  useEffect(() => {
    if (!config.enabled || !config.autoScroll) return;
    if (!playerProgress || !cuelineRef.current) return;

    const currentSecond = Math.floor(playerProgress);
    const wrapper = cuelineRef.current;

    Array.from(wrapper.children).forEach((c, i, arr) => {
      if (!(c instanceof HTMLElement)) return;
      const start = parseInt(c.getAttribute('data-start') || '-1');
      const end = parseInt(arr[i + 1]?.getAttribute('data-start') || '-1');

      if (start <= currentSecond && currentSecond < end) {
        // set active
        c.classList.add('active');
        // scroll into view
        if (autoScrollRef.current) {
          wrapper.scrollTo({
            top: c.offsetTop - wrapper.offsetTop - wrapper.offsetHeight / 2 + c.offsetHeight,
            left: 0,
            behavior: 'smooth',
          });
        }
      } else {
        c.classList.remove('active');
      }
    });
  }, [playerProgress, config.enabled, config.autoScroll]);

  // create tracks
  useEffect(() => {
    if (!config.enabled) return;
    if (!subtitles || subtitles.length < 1) return;

    setTimeout(() => {
      // tracks
      // @ts-expect-error js module
      import('webvtt-parser').then(({ WebVTTParser }) => {
        const parser = new WebVTTParser();
        tracksRef.current = {};

        subtitles.forEach((result) => {
          parser.parse(result.lines).cues.forEach((cue: Cue) => {
            const startTime = Math.floor(cue.startTime);
            if (!tracksRef.current[startTime]) {
              tracksRef.current[startTime] = {};
            }
            tracksRef.current[startTime][result.lang] = cue.text;
          });
        });

        // set default langs
        const browserLang = navigator.language.split('-')[0];
        // if has browser lang set true else set first lang
        const langs: Record<string, boolean> = subtitles.reduce<Record<string, boolean>>((acc, result) => {
          acc[result.lang] = result.lang === browserLang;
          return acc;
        }, {});

        if (!langs[browserLang]) {
          langs[subtitles[0].lang] = true;
        }
        setLangs(langs);
      });
    }, 10);
  }, [subtitles, config.enabled]);

  if (!subtitles || subtitles.length < 1) return null;
  if (!data) return null;

  return (
    <Box className="subtitlewrapper" sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1 }, overflow: 'auto', flexShrink: 0 }}>
        {config.enabled && Object.values(tracksRef.current).length > 0 && (
          <>
            {Object.keys(langs).map((lang) => (
              <FormControlLabel
                key={lang}
                label={t(lang)}
                control={
                  <Checkbox
                    size="small"
                    checked={langs[lang]}
                    value={lang}
                    onChange={(e) => setLangs({ ...langs, [lang]: e.target.checked })}
                  />
                }
              />
            ))}
            <TextField
              variant="standard"
              type="search"
              size="small"
              placeholder={t('Search')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
              onChange={searchText}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {config.enabled && (
          <FormControlLabel
            control={
              <Switch
                onChange={(e) => {
                  autoScrollRef.current = e.target.checked;
                  setConfig({ ...config, autoScroll: e.target.checked });
                }}
                checked={!!config.autoScroll}
                size="small"
              />
            }
            label={t('Enable auto scroll')}
            labelPlacement="start"
          />
        )}
        <FormControlLabel
          control={
            <Switch
              checked={!!config.enabled}
              size="small"
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
          }
          label={t('Enable subtitle')}
          labelPlacement="start"
          sx={{ mr: 0, py: 1 }}
        />
      </Box>
      {config.enabled && Object.values(tracksRef.current).length > 0 && (
        <Box
          className="subtitlebox"
          ref={cuelineRef}
          sx={{ overflow: 'scroll', border: 1, borderColor: 'divider', maxHeight: '400px' }}
        >
          <SubtitleLines tracksRef={tracksRef} langs={langs} />
        </Box>
      )}
    </Box>
  );
};

interface SubtitleLinesProps {
  tracksRef: React.RefObject<Record<number, Record<string, string>>>;
  langs: Record<string, boolean>;
}

// use memo
const SubtitleLines = memo(({ tracksRef, langs }: SubtitleLinesProps) => {
  const { t } = useTranslation('video');
  const playerInstance = useAtomValue(playerInstanceState);

  if (!tracksRef.current) return null;

  return (
    <>
      {Object.entries(tracksRef.current).map(([startTime, tracks]) => (
        <Stack
          key={startTime}
          data-start={startTime}
          direction="row"
          sx={{
            px: '.5em',
            alignItems: 'center',
            cursor: 'pointer',
            ':hover': { bgcolor: 'action.hover' },
            '&.active': {
              bgcolor: 'action.selected',
            },
          }}
          onClick={() => playerInstance?.seekTo(parseInt(startTime, 10))}
        >
          <Box sx={{ minWidth: '50px', fontSize: '.9em' }}>{formatDuration(startTime)}</Box>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            {Object.keys(langs)
              .filter((lang) => langs[lang])
              .map((lang) => (
                <Box
                  className="text"
                  component="span"
                  key={lang}
                  sx={{ lineHeight: 1.1, flexGrow: 1, flexBasis: 0, borderColor: 'grey.400', padding: 0.5 }}
                >
                  {tracks[lang]}
                </Box>
              ))}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(
                `${formatDuration(startTime)} ${Object.values(tracks)
                  .join(' ')
                  .replace(/[\n\r]/g, ' ')}`,
              );
            }}
            title={t('Copy')}
          >
            <ContentCopyOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
    </>
  );
});
