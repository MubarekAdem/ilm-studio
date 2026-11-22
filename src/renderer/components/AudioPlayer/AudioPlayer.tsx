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
} from 'react-icons/fi';
import { Howl } from 'howler';
import { usePlayerStore } from '../../stores/playerStore';
import { useAppStore } from '../../stores/appStore';

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
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const toast = useToast();

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    currentLecture,
    bookmarks,
    play,
    pause,
    seek,
    setSpeed,
    setVolume,
    addBookmark,
    removeBookmark,
    loadBookmarks,
  } = usePlayerStore();

  const lecturesList = useAppStore((s) => s.lecturesList);
  const selectLecture = useAppStore((s) => s.selectLecture);

  const barBg = useColorModeValue('gray.100', '#0f172a');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimerRemaining) return;
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (!prev || prev <= 1) {
          pause();
          toast({
            title: 'Sleep timer ended',
            description: 'Audio playback paused automatically.',
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

  // Handle auto-advance when lecture finishes
  const handleLectureEnd = useCallback(() => {
    pause();
    if (!currentLecture) return;

    // Mark as 100% completed
    window.api.updateLecture(currentLecture.id, {
      completionPct: 100,
      lastPosition: duration,
    }).catch(console.error);

    // Find next lecture in sequence
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
        title: 'Series completed! 🎉',
        description: 'You have finished all lectures in this course.',
        status: 'success',
        duration: 5000,
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

    const howl = new Howl({
      src: [currentLecture.audioPath],
      html5: true,
      volume: volume,
      rate: playbackSpeed,
      onload: () => {
        const initialPos = currentLecture.lastPosition || 0;
        usePlayerStore.getState().seek(initialPos);
        howl.seek(initialPos);
        const dur = howl.duration();
        usePlayerStore.setState({ duration: dur });
      },
      onplay: () => {
        updateProgress();
      },
      onend: () => {
        handleLectureEnd();
      },
    });

    howlRef.current = howl;

    return () => {
      howl.unload();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLecture?.id, currentLecture?.audioPath]);

  // Sync play/pause state to Howl
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

  // Animation loop for progress and periodic position persistence
  const updateProgress = useCallback(() => {
    const howl = howlRef.current;
    if (howl && howl.playing()) {
      const pos = howl.seek() as number;
      usePlayerStore.setState({ currentTime: pos });

      // Save position to SQLite every 5 seconds
      const now = Date.now();
      if (now - lastSaveTimeRef.current > 5000 && currentLecture) {
        lastSaveTimeRef.current = now;
        const dur = howl.duration();
        const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
        window.api.updateLecture(currentLecture.id, {
          lastPosition: pos,
          duration: dur,
          completionPct: pct,
        }).catch(console.error);
      }
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [currentLecture]);

  const handlePlayPause = () => {
    if (!currentLecture) return;
    if (isPlaying) {
      pause();
      // Save position on pause
      if (howlRef.current) {
        const pos = howlRef.current.seek() as number;
        const dur = howlRef.current.duration();
        const pct = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
        window.api.updateLecture(currentLecture.id, {
          lastPosition: pos,
          completionPct: pct,
        }).catch(console.error);
      }
    } else {
      play();
    }
  };

  const handleSeek = (val: number) => {
    seek(val);
    howlRef.current?.seek(val);
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    handleSeek(newTime);
  };

  const handleAddBookmark = () => {
    if (currentLecture) {
      addBookmark(`Bookmark at ${formatTime(currentTime)}`);
      toast({
        title: 'Bookmark saved',
        description: formatTime(currentTime),
        status: 'success',
        duration: 1500,
        isClosable: true,
        position: 'bottom-right',
      });
    }
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

  return (
    <Box
      h="72px"
      bg={barBg}
      borderTop="1px solid"
      borderColor={borderColor}
      px={4}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      boxShadow="0 -2px 10px rgba(0,0,0,0.15)"
    >
      {/* Progress bar */}
      <Slider
        aria-label="Audio progress"
        value={currentTime}
        min={0}
        max={duration || 1}
        step={0.1}
        onChange={handleSeek}
        size="sm"
        colorScheme="green"
        mb={1}
      >
        <SliderTrack h="4px" borderRadius="full">
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb boxSize={3.5} />
      </Slider>

      {/* Controls row */}
      <Flex align="center" justify="space-between">
        {/* Left: Lecture title and duration */}
        <Box flex={1} minW={0} mr={4}>
          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
            {currentLecture.title}
          </Text>
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
            {sleepTimerRemaining && (
              <Badge colorScheme="purple" fontSize="2xs">
                ⏰ {Math.ceil(sleepTimerRemaining / 60)}m left
              </Badge>
            )}
          </HStack>
        </Box>

        {/* Center: Playback controls */}
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
        </HStack>

        {/* Right: Speed, Volume, Sleep Timer, Bookmarks */}
        <HStack spacing={2} flex={1} justify="flex-end">
          {/* Speed selector */}
          <Menu>
            <Tooltip label="Playback Speed">
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                fontSize="xs"
                fontWeight="bold"
                minW="42px"
              >
                {playbackSpeed}x
              </MenuButton>
            </Tooltip>
            <MenuList minW="85px" py={1}>
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
                        title: `Sleep timer set for ${opt.minutes} min`,
                        status: 'info',
                        duration: 2000,
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

          {/* Volume slider */}
          <HStack spacing={1} w="110px">
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

          {/* Bookmarks Popover List */}
          <Popover placement="top-end">
            <PopoverTrigger>
              <Box>
                <Tooltip label="Lecture Bookmarks">
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
            <PopoverContent w="280px" bg={useColorModeValue('white', '#16213e')}>
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
                      _hover={{ bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.100') }}
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
                      No bookmarks saved yet. Click "+ Add Current" to mark a spot.
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
