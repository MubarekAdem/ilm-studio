import React, { useCallback, useEffect, useRef } from 'react';
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
} from '@chakra-ui/react';
import {
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiBookmark,
  FiVolume2,
  FiVolumeX,
} from 'react-icons/fi';
import { Howl } from 'howler';
import { usePlayerStore } from '../../stores/playerStore';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

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

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    currentLecture,
    play,
    pause,
    seek,
    setSpeed,
    setVolume,
    addBookmark,
  } = usePlayerStore();

  const barBg = useColorModeValue('gray.100', '#0d1117');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  // Create / destroy Howl when lecture changes
  useEffect(() => {
    // Clean up old instance
    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!currentLecture?.audioPath) return;

    const howl = new Howl({
      src: [currentLecture.audioPath],
      html5: true,
      volume: volume,
      rate: playbackSpeed,
      onload: () => {
        usePlayerStore.getState().seek(currentLecture.lastPosition || 0);
        const dur = howl.duration();
        // Manually set duration in store if the store exposes it
        usePlayerStore.setState({ duration: dur });
      },
      onplay: () => {
        updateProgress();
      },
      onend: () => {
        pause();
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

  // Animation loop for progress
  const updateProgress = useCallback(() => {
    const howl = howlRef.current;
    if (howl && howl.playing()) {
      const pos = howl.seek() as number;
      usePlayerStore.setState({ currentTime: pos });
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const handlePlayPause = () => {
    if (!currentLecture) return;
    if (isPlaying) {
      pause();
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

  const handleBookmark = () => {
    if (currentLecture) {
      addBookmark(`Bookmark at ${formatTime(currentTime)}`);
    }
  };

  // If no lecture, show minimal bar
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
          No lecture loaded — select a lecture to start listening
        </Text>
      </Box>
    );
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

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
    >
      {/* Progress bar (thin, at top of player bar) */}
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
        <SliderTrack h="3px">
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb boxSize={3} />
      </Slider>

      {/* Controls row */}
      <Flex align="center" justify="space-between">
        {/* Left: Lecture title */}
        <Box flex={1} minW={0} mr={4}>
          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
            {currentLecture.title}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </Box>

        {/* Center: Playback controls */}
        <HStack spacing={2}>
          <Tooltip label="Back 10s">
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

        {/* Right: Speed, volume, bookmark */}
        <HStack spacing={2} flex={1} justify="flex-end">
          {/* Speed selector */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              fontSize="xs"
              fontWeight="bold"
              minW="40px"
            >
              {playbackSpeed}x
            </MenuButton>
            <MenuList minW="80px">
              {SPEED_OPTIONS.map((speed) => (
                <MenuItem
                  key={speed}
                  fontSize="sm"
                  fontWeight={playbackSpeed === speed ? 'bold' : 'normal'}
                  color={playbackSpeed === speed ? 'green.400' : undefined}
                  onClick={() => setSpeed(speed)}
                >
                  {speed}x
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Volume */}
          <HStack spacing={1} w="120px">
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

          {/* Bookmark */}
          <Tooltip label="Bookmark current position">
            <IconButton
              aria-label="Bookmark"
              icon={<FiBookmark />}
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
};

export default AudioPlayer;
