import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Flex,
  Tooltip,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  Divider,
  useToast,
  Badge,
  Input,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiBookmark,
  FiVolume2,
  FiVolumeX,
  FiClock,
  FiTrash2,
  FiRepeat,
  FiList,
  FiSliders,
} from 'react-icons/fi';
import { Howl } from 'howler';
import { usePlayerStore, EqPreset } from '../../stores/playerStore';
import { useAppStore } from '../../stores/appStore';
import { applyEqPreset } from '../../utils/audioFilters';
import { toMediaUrl } from '../../utils/mediaUrl';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];
const SLEEP_TIMER_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

/** Format seconds to mm:ss or hh:mm:ss */
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ss = s.toString().padStart(2, '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

export const AudioPlayer: React.FC = () => {
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const accumulatedActiveSecondsRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const initialSeekTargetRef = useRef<number>(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const toast = useToast();

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    loopA,
    loopB,
    isLooping,
    skipSilence,
    eqPreset,
    currentLecture,
    bookmarks,
    chapters,
    currentChapter,
    play,
    pause,
    seek,
    setSpeed,
    setVolume,
    setLoopA,
    setLoopB,
    clearLoop,
    setSkipSilence,
    setEqPreset,
    addBookmark,
    removeBookmark,
    loadBookmarks,
    loadChapters,
    addChapter,
    deleteChapter,
  } = usePlayerStore();

  const lecturesList = useAppStore((s) => s.lecturesList);
  const selectLecture = useAppStore((s) => s.selectLecture);

  const barBg = useColorModeValue('gray.100', '#0f172a');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const popoverBg = useColorModeValue('white', '#16213e');
  const itemHoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');

  // Helper to get underlying HTMLAudioElement for Web Audio EQ
  const getAudioElement = useCallback((): HTMLAudioElement | null => {
    const howl = howlRef.current;
    if (!howl) return null;
    const sound = (howl as any)._sounds?.[0];
    return (sound?._node as HTMLAudioElement) || null;
  }, []);

  // Sync EQ preset to Web Audio filter chain
  useEffect(() => {
    const el = getAudioElement();
    if (el) {
      applyEqPreset(el, eqPreset);
    }
  }, [eqPreset, getAudioElement]);

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimerRemaining) return;
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (!prev || prev <= 1) {
          pause();
          toast({
            title: 'Sleep timer ended',
            description: 'Playback paused.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining, pause, toast]);

  // Flush accumulated active listening time to SQLite study_sessions
  const flushStudySession = useCallback(() => {
    if (!currentLecture || accumulatedActiveSecondsRef.current < 3) return;
    const durToLog = Math.round(accumulatedActiveSecondsRef.current);
    accumulatedActiveSecondsRef.current = 0;
    const endIso = new Date().toISOString();
    const startIso = new Date(Date.now() - durToLog * 1000).toISOString();
    window.api
      .logSession({
        lectureId: currentLecture.id,
        startTime: startIso,
        endTime: endIso,
        duration: durToLog,
      })
      .catch(console.error);
  }, [currentLecture]);

  // Persist playback position to SQLite, in-memory store, and localStorage
  const persistAudioPosition = useCallback(
    (lectureId: string, seriesId: string | null | undefined, pos: number, dur?: number, pct?: number) => {
      if (!lectureId || !isFinite(pos)) return;
      const safePos = Math.max(0, pos);
      try {
        localStorage.setItem(`ilm_last_audio_pos_${lectureId}`, String(safePos));
        localStorage.setItem('ilm_last_played_lecture_id', lectureId);
        if (seriesId) {
          localStorage.setItem(`ilm_last_played_lecture_${seriesId}`, lectureId);
          localStorage.setItem('ilm_last_played_series_id', seriesId);
        }
      } catch {}

      const payload: { lastPosition: number; duration?: number; completionPct?: number } = {
        lastPosition: safePos,
      };
      if (typeof dur === 'number' && isFinite(dur)) payload.duration = dur;
      if (typeof pct === 'number' && isFinite(pct)) payload.completionPct = pct;

      window.api.updateLecture(lectureId, payload).catch(console.error);

      usePlayerStore.setState((s) => ({
        currentLecture:
          s.currentLecture?.id === lectureId
            ? { ...s.currentLecture, ...payload }
            : s.currentLecture,
      }));
    },
    []
  );

  // Save position if user closes window
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!currentLecture || !howlRef.current) return;
      try {
        const rawPos = howlRef.current.seek();
        const pos = typeof rawPos === 'number' && isFinite(rawPos) ? rawPos : 0;
        if (pos > 0) {
          persistAudioPosition(currentLecture.id, currentLecture.seriesId, pos);
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentLecture, persistAudioPosition]);

  // Handle auto-advance when lecture finishes
  const handleLectureEnd = useCallback(() => {
    pause();
    if (!currentLecture) return;

    flushStudySession();
    // Schedule for spaced repetition review
    window.api.updateReviewSchedule(currentLecture.id, 'good').catch(console.error);

    window.api.updateLecture(currentLecture.id, {
      completionPct: 100,
      lastPosition: duration,
    }).catch(console.error);

    const currentIndex = lecturesList.findIndex((l) => l.id === currentLecture.id);
    if (currentIndex >= 0 && currentIndex < lecturesList.length - 1) {
      const nextLecture = lecturesList[currentIndex + 1];
      toast({
        title: 'Lecture completed',
        description: `Up next: ${nextLecture.title}`,
        status: 'success',
        duration: 3500,
        isClosable: true,
      });

      selectLecture(nextLecture.id);
      if (nextLecture.audioPath) {
        setTimeout(() => play(nextLecture), 500);
      }
    } else {
      toast({
        title: 'Course completed! 🎉',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [currentLecture, duration, lecturesList, pause, play, selectLecture, toast]);

  // Create / destroy Howl when lecture changes
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!currentLecture?.audioPath) return;

    loadBookmarks(currentLecture.id);
    loadChapters(currentLecture.id);

    const audioSrc = toMediaUrl(currentLecture.audioPath);
    const ext = currentLecture.audioPath.split('.').pop()?.toLowerCase() || 'mp3';

    // Retrieve last position from localStorage or lecture record
    const savedPosStr = typeof window !== 'undefined'
      ? localStorage.getItem(`ilm_last_audio_pos_${currentLecture.id}`)
      : null;
    const savedPos = savedPosStr ? parseFloat(savedPosStr) : 0;
    const rawPos = currentLecture.lastPosition;
    const initialPos = Math.max(
      0,
      isFinite(savedPos) && savedPos > 0
        ? savedPos
        : (typeof rawPos === 'number' && isFinite(rawPos) && rawPos > 0 ? rawPos : 0)
    );
    initialSeekTargetRef.current = initialPos;

    const howl = new Howl({
      src: [audioSrc],
      format: [ext],
      html5: true,
      volume: volume,
      rate: playbackSpeed,
      onload: () => {
        usePlayerStore.getState().seek(initialPos);
        const rawDur = howl.duration();
        const dur = typeof rawDur === 'number' && isFinite(rawDur) ? rawDur : 0;
        usePlayerStore.setState({ duration: dur });

        if (initialPos > 0) {
          try {
            const sound = (howl as any)._sounds?.[0];
            if (sound?._node && isFinite(sound._node.duration) && sound._node.duration > 0) {
              sound._node.currentTime = Math.min(sound._node.duration, initialPos);
            } else {
              howl.seek(initialPos);
            }
          } catch (e) {
            console.warn('[AudioPlayer] initial seek warning:', e);
          }
        }
        const el = getAudioElement();
        if (el) applyEqPreset(el, eqPreset);

        // If player state is set to playing, start Howler immediately
        if (usePlayerStore.getState().isPlaying && !howl.playing()) {
          try {
            howl.play();
          } catch (e) {
            console.warn('[AudioPlayer] auto-play on load error:', e);
          }
        }
      },
      onloaderror: (_id, err) => {
        console.error('[AudioPlayer] Howler load error:', err, 'for URL:', audioSrc);
      },
      onplayerror: (_id, err) => {
        console.error('[AudioPlayer] Howler play error:', err);
        howl.once('unlock', () => {
          howl.play();
        });
      },
      onplay: () => {
        if (initialSeekTargetRef.current > 0) {
          const target = initialSeekTargetRef.current;
          try {
            const cur = howl.seek();
            if (typeof cur === 'number' && Math.abs(cur - target) > 1.5) {
              const sound = (howl as any)._sounds?.[0];
              if (sound?._node) {
                sound._node.currentTime = target;
              } else {
                howl.seek(target);
              }
              usePlayerStore.getState().seek(target);
            }
          } catch (e) {
            console.warn('[AudioPlayer] onplay seek ensure:', e);
          }
          initialSeekTargetRef.current = 0;
        }
        updateProgress();
        const el = getAudioElement();
        if (el) applyEqPreset(el, eqPreset);
      },
      onend: () => {
        handleLectureEnd();
      },
    });

    howlRef.current = howl;

    return () => {
      flushStudySession();
      if (currentLecture && howlRef.current) {
        try {
          const rawPos = howlRef.current.seek();
          const pos = typeof rawPos === 'number' && isFinite(rawPos) ? rawPos : 0;
          if (pos > 0) {
            persistAudioPosition(currentLecture.id, currentLecture.seriesId, pos);
          }
        } catch {}
      }
      howl.unload();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLecture?.id, currentLecture?.audioPath]);

  // Sync play/pause state
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (isPlaying && !howl.playing()) {
      howl.play();
    } else if (!isPlaying && howl.playing()) {
      howl.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    howlRef.current?.volume(volume);
  }, [volume]);

  // Sync playback speed
  useEffect(() => {
    howlRef.current?.rate(playbackSpeed);
  }, [playbackSpeed]);

  // Animation loop: handles progress, A-B loop boundary check, and DB persistence
  const updateProgress = useCallback(() => {
    const howl = howlRef.current;
    if (howl && howl.playing()) {
      const rawPos = howl.seek();
      const pos = typeof rawPos === 'number' && isFinite(rawPos) ? rawPos : 0;

      // Track active listening seconds
      const now = Date.now();
      if (lastTickTimeRef.current > 0) {
        const delta = (now - lastTickTimeRef.current) / 1000;
        if (delta > 0 && delta < 2) {
          accumulatedActiveSecondsRef.current += delta;
        }
      }
      lastTickTimeRef.current = now;

      // Flush session log to SQLite every 20 seconds of continuous listening
      if (accumulatedActiveSecondsRef.current >= 20) {
        flushStudySession();
      }

      // A-B Loop boundary check
      const { loopA, loopB, isLooping } = usePlayerStore.getState();
      if (isLooping && loopA !== null && loopB !== null && loopB > loopA) {
        if (pos >= loopB) {
          howl.seek(loopA);
          usePlayerStore.getState().setCurrentTime(loopA);
          rafRef.current = requestAnimationFrame(updateProgress);
          return;
        }
      }

      usePlayerStore.getState().setCurrentTime(pos);

      // Save position to SQLite & localStorage every 5 seconds
      if (now - lastSaveTimeRef.current > 5000 && currentLecture) {
        lastSaveTimeRef.current = now;
        const rawDur = howl.duration();
        const dur = typeof rawDur === 'number' && isFinite(rawDur) ? rawDur : 0;
        const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
        persistAudioPosition(currentLecture.id, currentLecture.seriesId, pos, dur, pct);
      }
    } else {
      lastTickTimeRef.current = 0;
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [currentLecture, flushStudySession, persistAudioPosition]);

  const handlePlayPause = () => {
    if (!currentLecture) return;
    if (isPlaying) {
      pause();
      howlRef.current?.pause();
      flushStudySession();
      lastTickTimeRef.current = 0;
      if (howlRef.current) {
        const rawPos = howlRef.current.seek();
        const pos = typeof rawPos === 'number' && isFinite(rawPos) ? rawPos : 0;
        const rawDur = howlRef.current.duration();
        const dur = typeof rawDur === 'number' && isFinite(rawDur) ? rawDur : 0;
        const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
        persistAudioPosition(currentLecture.id, currentLecture.seriesId, pos, dur, pct);
      }
    } else {
      lastTickTimeRef.current = Date.now();
      play();
      howlRef.current?.play();
    }
  };

  const handleSeek = (val: number) => {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return;
    const safeVal = Math.max(0, val);
    seek(safeVal);
    const howl = howlRef.current;
    if (howl) {
      try {
        const sound = (howl as any)._sounds?.[0];
        if (sound?._node && isFinite(sound._node.duration) && sound._node.duration > 0) {
          const clamped = Math.min(sound._node.duration, safeVal);
          if (isFinite(clamped)) {
            sound._node.currentTime = clamped;
          }
        } else {
          howl.seek(safeVal);
        }
      } catch (err) {
        console.warn('[AudioPlayer] Seek error safely caught:', err);
      }
    }
    if (currentLecture) {
      persistAudioPosition(currentLecture.id, currentLecture.seriesId, safeVal);
    }
  };

  const handleSkipBack = () => {
    const cur = typeof currentTime === 'number' && isFinite(currentTime) ? currentTime : 0;
    const newTime = Math.max(0, cur - 10);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const cur = typeof currentTime === 'number' && isFinite(currentTime) ? currentTime : 0;
    const dur = typeof duration === 'number' && isFinite(duration) ? duration : cur + 10;
    const newTime = Math.min(dur, cur + 10);
    handleSeek(newTime);
  };

  // A-B Loop handler
  const handleLoopClick = () => {
    if (loopA === null) {
      setLoopA(currentTime);
      toast({
        title: `Loop Point A set at ${formatTime(currentTime)}`,
        description: 'Click again at Point B to begin looping.',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } else if (loopB === null) {
      if (currentTime > loopA) {
        setLoopB(currentTime);
        toast({
          title: `Loop Active: ${formatTime(loopA)} ↔ ${formatTime(currentTime)}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Point B must be after Point A',
          status: 'warning',
          duration: 2000,
          isClosable: true,
        });
      }
    } else {
      clearLoop();
      toast({
        title: 'A-B Loop cleared',
        status: 'info',
        duration: 1500,
        isClosable: true,
      });
    }
  };

  const handleAddBookmark = () => {
    if (currentLecture) {
      addBookmark(`Bookmark at ${formatTime(currentTime)}`);
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    await addChapter(newChapterTitle.trim(), Math.round(currentTime));
    setNewChapterTitle('');
    toast({
      title: 'Chapter marker added',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (!currentLecture) {
    return (
      <Box
        h="72px"
        bg={barBg}
        borderTop="1px solid"
        borderColor={borderColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500" fontSize="sm">
          No lecture loaded — select a lecture from the sidebar to start listening
        </Text>
      </Box>
    );
  }

  // Calculate loop region positions for progress bar visualization
  const loopA_pct = loopA !== null && duration > 0 ? (loopA / duration) * 100 : null;
  const loopB_pct = loopB !== null && duration > 0 ? (loopB / duration) * 100 : null;

  return (
    <Box
      h="84px"
      bg={barBg}
      borderTop="1px solid"
      borderColor={borderColor}
      px={4}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      boxShadow="0 -3px 12px rgba(0,0,0,0.2)"
    >
      {/* Progress bar container with A-B loop shading & chapter ticks */}
      <Box position="relative" mb={1} pt={1}>
        {/* Shaded loop region */}
        {loopA_pct !== null && loopB_pct !== null && (
          <Box
            position="absolute"
            top="5px"
            left={`${loopA_pct}%`}
            width={`${loopB_pct - loopA_pct}%`}
            height="4px"
            bg="rgba(77, 179, 127, 0.45)"
            borderRadius="full"
            pointerEvents="none"
            zIndex={1}
          />
        )}

        {/* Chapter marker ticks */}
        {chapters.map((ch) => {
          const pct = duration > 0 ? (ch.startTime / duration) * 100 : 0;
          return (
            <Tooltip key={ch.id} label={`${ch.title} (${formatTime(ch.startTime)})`}>
              <Box
                position="absolute"
                top="4px"
                left={`${pct}%`}
                width="2px"
                height="6px"
                bg="yellow.400"
                borderRadius="full"
                cursor="pointer"
                zIndex={2}
                onClick={() => handleSeek(ch.startTime)}
              />
            </Tooltip>
          );
        })}

        <Slider
          aria-label="Audio progress"
          value={typeof currentTime === 'number' && isFinite(currentTime) && currentTime >= 0 ? currentTime : 0}
          min={0}
          max={typeof duration === 'number' && isFinite(duration) && duration > 0 ? duration : 1}
          step={0.1}
          onChange={handleSeek}
          isDisabled={!currentLecture?.audioPath || !isFinite(duration) || duration <= 0}
          size="sm"
          colorScheme="green"
        >
          <SliderTrack h="4px" borderRadius="full">
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={3.5} />
        </Slider>
      </Box>

      {/* Controls row */}
      <Flex align="center" justify="space-between">
        {/* Left: Lecture title, chapter title, duration */}
        <Box flex={1} minW={0} mr={3}>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
              {currentLecture.title}
            </Text>
            {currentChapter && (
              <Badge colorScheme="yellow" fontSize="2xs" maxW="180px" noOfLines={1}>
                § {currentChapter.title}
              </Badge>
            )}
          </HStack>
          <HStack spacing={2} mt={0.5}>
            <Text fontSize="2xs" color="gray.400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            {isLooping && loopA !== null && loopB !== null && (
              <Badge colorScheme="green" fontSize="2xs">
                Loop: {formatTime(loopA)}–{formatTime(loopB)}
              </Badge>
            )}
            {eqPreset !== 'normal' && (
              <Badge colorScheme="blue" fontSize="2xs">
                EQ: {eqPreset}
              </Badge>
            )}
            {sleepTimerRemaining && (
              <Badge colorScheme="purple" fontSize="2xs">
                ⏰ {Math.ceil(sleepTimerRemaining / 60)}m
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Center: Playback & A-B Loop controls */}
        <HStack spacing={2}>
          <Tooltip label="Rewind 10s">
            <IconButton
              aria-label="Skip back 10 seconds"
              icon={<FiSkipBack />}
              variant="ghost"
              size="sm"
              onClick={handleSkipBack}
            />
          </Tooltip>

          <IconButton
            aria-label={isPlaying ? 'Pause' : 'Play'}
            icon={isPlaying ? <FiPause /> : <FiPlay />}
            variant="solid"
            colorScheme="green"
            size="md"
            borderRadius="full"
            onClick={handlePlayPause}
          />

          <Tooltip label="Forward 10s">
            <IconButton
              aria-label="Skip forward 10 seconds"
              icon={<FiSkipForward />}
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
            />
          </Tooltip>

          {/* A-B Loop Button */}
          <Tooltip
            label={
              loopA === null
                ? 'Set Loop Point A'
                : loopB === null
                ? 'Set Loop Point B'
                : 'Clear A-B Loop'
            }
          >
            <Button
              size="xs"
              variant={isLooping ? 'solid' : loopA !== null ? 'outline' : 'ghost'}
              colorScheme={isLooping ? 'green' : loopA !== null ? 'yellow' : undefined}
              leftIcon={<FiRepeat />}
              onClick={handleLoopClick}
            >
              {loopA === null ? 'A-B' : loopB === null ? `A: ${formatTime(loopA)}` : 'Looping'}
            </Button>
          </Tooltip>
        </HStack>

        {/* Right: Speed, EQ, Chapters, Volume, Bookmarks */}
        <HStack spacing={1.5} flex={1} justify="flex-end">
          {/* Playback Speed */}
          <Menu>
            <Tooltip label="Playback Speed">
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                fontSize="xs"
                fontWeight="bold"
                minW="40px"
                px={1}
              >
                {playbackSpeed}x
              </MenuButton>
            </Tooltip>
            <MenuList minW="80px" py={1}>
              {SPEED_OPTIONS.map((speed) => (
                <MenuItem
                  key={speed}
                  fontSize="xs"
                  fontWeight={playbackSpeed === speed ? 'bold' : 'normal'}
                  color={playbackSpeed === speed ? 'green.400' : undefined}
                  onClick={() => setSpeed(speed)}
                >
                  {speed}x
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Equalizer / Audio Enhancement */}
          <Menu>
            <Tooltip label="Audio Enhancements & EQ">
              <MenuButton
                as={IconButton}
                aria-label="Equalizer"
                icon={<FiSliders />}
                variant="ghost"
                size="sm"
                color={eqPreset !== 'normal' ? 'blue.300' : undefined}
              />
            </Tooltip>
            <MenuList minW="170px" py={1}>
              <Box px={3} py={1}>
                <Text fontSize="2xs" fontWeight="bold" color="gray.400" textTransform="uppercase">
                  Audio Enhancements
                </Text>
              </Box>
              <MenuItem
                fontSize="xs"
                fontWeight={eqPreset === 'normal' ? 'bold' : 'normal'}
                onClick={() => setEqPreset('normal')}
              >
                Normal (Flat)
              </MenuItem>
              <MenuItem
                fontSize="xs"
                fontWeight={eqPreset === 'clarity' ? 'bold' : 'normal'}
                onClick={() => setEqPreset('clarity')}
              >
                🎙️ Voice Clarity Boost
              </MenuItem>
              <MenuItem
                fontSize="xs"
                fontWeight={eqPreset === 'cassette' ? 'bold' : 'normal'}
                onClick={() => setEqPreset('cassette')}
              >
                📻 Tape De-Hiss & Filter
              </MenuItem>
              <MenuItem
                fontSize="xs"
                fontWeight={eqPreset === 'bass' ? 'bold' : 'normal'}
                onClick={() => setEqPreset('bass')}
              >
                🔊 Rich Vocal Warmth
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Chapter Section Navigator */}
          <Popover placement="top-end">
            <PopoverTrigger>
              <Box>
                <Tooltip label="Lecture Chapters">
                  <IconButton
                    aria-label="Chapters"
                    icon={<FiList />}
                    variant="ghost"
                    size="sm"
                    color={chapters.length > 0 ? 'yellow.300' : undefined}
                  />
                </Tooltip>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="300px" bg={popoverBg}>
              <PopoverArrow />
              <PopoverCloseButton size="sm" />
              <PopoverHeader fontWeight="bold" fontSize="xs">
                Lecture Chapters ({chapters.length})
              </PopoverHeader>
              <PopoverBody maxH="220px" overflowY="auto" px={2} py={2}>
                <VStack spacing={1.5} align="stretch">
                  {chapters.map((ch) => (
                    <HStack
                      key={ch.id}
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={currentChapter?.id === ch.id ? 'whiteAlpha.150' : 'transparent'}
                      _hover={{ bg: itemHoverBg }}
                      justify="space-between"
                      cursor="pointer"
                      onClick={() => {
                        handleSeek(ch.startTime);
                        play();
                      }}
                    >
                      <HStack spacing={2} flex={1} minW={0}>
                        <Badge colorScheme="yellow" fontSize="2xs">
                          {formatTime(ch.startTime)}
                        </Badge>
                        <Text
                          fontSize="xs"
                          noOfLines={1}
                          fontWeight={currentChapter?.id === ch.id ? 'bold' : 'normal'}
                        >
                          {ch.title}
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Delete chapter"
                        icon={<FiTrash2 />}
                        size="2xs"
                        variant="ghost"
                        color="red.400"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(ch.id);
                        }}
                      />
                    </HStack>
                  ))}
                  {chapters.length === 0 && (
                    <Text fontSize="2xs" color="gray.500" textAlign="center" py={1}>
                      No chapters defined for this lecture.
                    </Text>
                  )}

                  <Divider />

                  <HStack spacing={1}>
                    <Input
                      placeholder={`Chapter at ${formatTime(currentTime)}`}
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      size="xs"
                    />
                    <Button
                      size="xs"
                      colorScheme="green"
                      onClick={handleCreateChapter}
                      flexShrink={0}
                    >
                      + Add
                    </Button>
                  </HStack>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* Sleep Timer */}
          <Menu>
            <Tooltip label="Sleep Timer">
              <MenuButton
                as={IconButton}
                aria-label="Sleep timer"
                icon={<FiClock />}
                variant="ghost"
                size="sm"
                color={sleepTimerRemaining ? 'purple.300' : undefined}
              />
            </Tooltip>
            <MenuList minW="100px" py={1}>
              {SLEEP_TIMER_OPTIONS.map((opt) => (
                <MenuItem
                  key={opt.minutes}
                  fontSize="xs"
                  onClick={() => {
                    setSleepTimerRemaining(opt.minutes > 0 ? opt.minutes * 60 : null);
                    if (opt.minutes > 0) {
                      toast({
                        title: `Sleep timer: ${opt.minutes}m`,
                        status: 'info',
                        duration: 1500,
                        isClosable: true,
                      });
                    }
                  }}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Volume */}
          <HStack spacing={1} w="95px">
            <IconButton
              aria-label="Toggle mute"
              icon={volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
              variant="ghost"
              size="sm"
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
            />
            <Slider
              aria-label="Volume"
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setVolume(v)}
              size="sm"
              colorScheme="green"
            >
              <SliderTrack h="3px">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={3} />
            </Slider>
          </HStack>

          {/* Bookmarks */}
          <Popover placement="top-end">
            <PopoverTrigger>
              <Box>
                <Tooltip label="Bookmarks">
                  <IconButton
                    aria-label="View bookmarks"
                    icon={<FiBookmark />}
                    variant="ghost"
                    size="sm"
                    color={bookmarks.length > 0 ? 'green.400' : undefined}
                  />
                </Tooltip>
              </Box>
            </PopoverTrigger>
            <PopoverContent w="280px" bg={popoverBg}>
              <PopoverArrow />
              <PopoverCloseButton size="sm" />
              <PopoverHeader fontWeight="bold" fontSize="xs">
                <HStack justify="space-between" pr={6}>
                  <Text>Bookmarks ({bookmarks.length})</Text>
                  <Button
                    size="2xs"
                    colorScheme="green"
                    onClick={handleAddBookmark}
                  >
                    + Add Current
                  </Button>
                </HStack>
              </PopoverHeader>
              <PopoverBody maxH="200px" overflowY="auto" px={2} py={2}>
                <VStack spacing={1} align="stretch">
                  {bookmarks.map((bm) => (
                    <HStack
                      key={bm.id}
                      px={2}
                      py={1}
                      borderRadius="md"
                      _hover={{ bg: itemHoverBg }}
                      justify="space-between"
                      cursor="pointer"
                      onClick={() => {
                        handleSeek(bm.position);
                        play();
                      }}
                    >
                      <HStack spacing={2} flex={1} minW={0}>
                        <Badge colorScheme="green" fontSize="2xs">
                          {formatTime(bm.position)}
                        </Badge>
                        <Text fontSize="xs" noOfLines={1}>
                          {bm.label}
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Delete bookmark"
                        icon={<FiTrash2 />}
                        size="2xs"
                        variant="ghost"
                        color="red.400"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(bm.id);
                        }}
                      />
                    </HStack>
                  ))}
                  {bookmarks.length === 0 && (
                    <Text fontSize="2xs" color="gray.500" textAlign="center" py={2}>
                      No bookmarks saved yet.
                    </Text>
                  )}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
      </Flex>
    </Box>
  );
};

export default AudioPlayer;
