import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Badge,
  Button,
  Icon,
  useColorModeValue,
  useToast,
  Divider,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiZap,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiPlay,
  FiRotateCw,
  FiBookOpen,
  FiTrendingUp,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import type {
  StudyStats,
  DailyStudyBreakdown,
  DueReviewItem,
  SeriesPacingInfo,
} from '../../../shared/types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [reviews, setReviews] = useState<DueReviewItem[]>([]);
  const [seriesPacing, setSeriesPacing] = useState<SeriesPacingInfo[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const selectSeries = useAppStore((s) => s.selectSeries);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const play = usePlayerStore((s) => s.play);

  const cardBg = useColorModeValue('#ffffff', '#181818');
  const cardHoverBg = useColorModeValue('#f7f7f7', '#222222');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');
  const subtleText = useColorModeValue('gray.600', 'gray.400');

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, reviewsData, pacingData, settingsData] = await Promise.all([
        window.api.getStats(),
        window.api.getDueReviews(),
        window.api.getSeriesPacing(),
        window.api.getSettings(),
      ]);
      setStats(statsData);
      setReviews(reviewsData);
      setSeriesPacing(pacingData);
      if (settingsData?.dailyGoalMinutes) {
        setDailyGoalMinutes(Number(settingsData.dailyGoalMinutes));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Periodically refresh stats so background/active listening minutes update live
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Handle reviewing lecture
  const handleStartReview = async (item: DueReviewItem) => {
    selectLecture(item.lectureId);
    setView('study');
    try {
      const lecture = await window.api.getLecture(item.lectureId);
      if (lecture?.audioPath) {
        play(lecture);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle spacing rating
  const handleRateReview = async (lectureId: string, rating: 'hard' | 'good' | 'easy') => {
    try {
      await window.api.updateReviewSchedule(lectureId, rating);
      toast({
        title: `Scheduled next review (${rating})`,
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle continuing series
  const handleContinueSeries = (pacing: SeriesPacingInfo) => {
    if (pacing.nextLecture) {
      selectSeries(pacing.seriesId);
      selectLecture(pacing.nextLecture.id);
      setView('study');
      if (pacing.nextLecture.audioPath) {
        play(pacing.nextLecture as any);
      }
    } else {
      selectSeries(pacing.seriesId);
      setView('study');
    }
  };

  const todayMinutes = stats?.todayMinutes || 0;
  const goalProgressPct = Math.min(100, Math.round((todayMinutes / (dailyGoalMinutes || 30)) * 100));

  // Find max minutes in weekly breakdown for chart scaling
  const weeklyData = stats?.weeklyBreakdown || [];
  const maxMins = Math.max(dailyGoalMinutes, ...weeklyData.map((d) => d.minutes), 45);

  return (
    <VStack
      align="stretch"
      spacing={6}
      p={{ base: 4, md: 8 }}
      maxW="1280px"
      mx="auto"
      h="100%"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
        },
      }}
    >
      {/* Header & Islamic Greeting */}
      <Box>
        <Text fontSize="sm" color="green.400" fontWeight="bold" letterSpacing="wider">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <HStack justify="space-between" align="baseline" wrap="wrap">
          <Heading size="lg" mt={1}>
            Study Analytics & Pacing
          </Heading>
          <Text fontSize="xs" color={subtleText}>
            مُتَابَعَةُ التَّعَلُّم وَالمُرَاجَعَة
          </Text>
        </HStack>
        <Text color={subtleText} fontSize="sm" mt={1}>
          Monitor your study consistency, lecture series milestones, and spaced repetition schedule.
        </Text>
      </Box>

      {/* Daily Target Progress Bar */}
      <Box
        p={4}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <HStack justify="space-between" mb={2}>
          <HStack spacing={2}>
            <Icon as={FiZap} color="yellow.400" />
            <Text fontSize="sm" fontWeight="bold">
              Daily Study Goal ({dailyGoalMinutes} mins)
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="bold" color="green.400">
              {todayMinutes}m / {dailyGoalMinutes}m
            </Text>
            <Badge colorScheme={goalProgressPct >= 100 ? 'green' : 'yellow'} fontSize="2xs">
              {goalProgressPct}%
            </Badge>
          </HStack>
        </HStack>
        <Progress
          value={goalProgressPct}
          colorScheme={goalProgressPct >= 100 ? 'green' : 'yellow'}
          size="sm"
          borderRadius="full"
          bg="blackAlpha.300"
        />
      </Box>

      {/* 4 Stat Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
        {/* Streak */}
        <Box
          p={4}
          bg={cardBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="orange.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xl">🔥</Text>
            </Box>
            <Stat>
              <StatLabel color={subtleText} fontSize="xs">
                Active Streak
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {stats?.currentStreak || 0} {stats?.currentStreak === 1 ? 'Day' : 'Days'}
              </StatNumber>
              <StatHelpText fontSize="2xs" mb={0} color="orange.300">
                Longest: {stats?.longestStreak || 0} days
              </StatHelpText>
            </Stat>
          </HStack>
        </Box>

        {/* Today Focus */}
        <Box
          p={4}
          bg={cardBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="teal.500"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiClock} boxSize={5} />
            </Box>
            <Stat>
              <StatLabel color={subtleText} fontSize="xs">
                Today's Focus
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {stats?.todayMinutes || 0}m
              </StatNumber>
              <StatHelpText fontSize="2xs" mb={0} color={subtleText}>
                Total: {stats?.totalStudyTimeMinutes || 0}m
              </StatHelpText>
            </Stat>
          </HStack>
        </Box>

        {/* Past 7 Days */}
        <Box
          p={4}
          bg={cardBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="green.600"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiCalendar} boxSize={5} />
            </Box>
            <Stat>
              <StatLabel color={subtleText} fontSize="xs">
                This Week
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {stats?.weekMinutes || 0}m
              </StatNumber>
              <StatHelpText fontSize="2xs" mb={0} color="green.300">
                ~{Math.round(((stats?.weekMinutes || 0) / 60) * 10) / 10} hours
              </StatHelpText>
            </Stat>
          </HStack>
        </Box>

        {/* Lectures Completed */}
        <Box
          p={4}
          bg={cardBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="purple.600"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiCheckCircle} boxSize={5} />
            </Box>
            <Stat>
              <StatLabel color={subtleText} fontSize="xs">
                Lectures Mastered
              </StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {stats?.completedLectures || 0} / {stats?.totalLectures || 0}
              </StatNumber>
              <StatHelpText fontSize="2xs" mb={0} color={subtleText}>
                Across {stats?.totalSeries || 0} courses
              </StatHelpText>
            </Stat>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* Weekly Study Activity Chart */}
      <Box
        p={5}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <HStack justify="space-between" mb={4}>
          <HStack spacing={2}>
            <Icon as={FiTrendingUp} color="green.400" />
            <Heading size="sm">Past 7 Days Activity</Heading>
          </HStack>
          <HStack spacing={2}>
            <Box w="10px" h="10px" bg="green.500" borderRadius="xs" />
            <Text fontSize="2xs" color={subtleText}>
              Minutes studied
            </Text>
          </HStack>
        </HStack>

        <HStack spacing={3} align="flex-end" h="140px" pt={4} pb={1} justify="space-between">
          {weeklyData.map((d) => {
            const heightPct = Math.max(6, Math.min(100, Math.round((d.minutes / maxMins) * 100)));
            const isToday = d.date === new Date().toISOString().slice(0, 10);
            return (
              <VStack key={d.date} flex={1} spacing={2} align="center" h="100%" justify="flex-end">
                <Tooltip label={`${d.date}: ${d.minutes} minutes`}>
                  <Box
                    w="100%"
                    maxW="36px"
                    h={`${heightPct}%`}
                    bg={d.minutes >= dailyGoalMinutes ? 'green.400' : isToday ? 'yellow.400' : 'green.700'}
                    borderRadius="md"
                    transition="all 0.2s"
                    _hover={{ opacity: 0.8 }}
                  />
                </Tooltip>
                <VStack spacing={0}>
                  <Text fontSize="2xs" fontWeight={isToday ? 'bold' : 'normal'} color={isToday ? 'green.400' : subtleText}>
                    {d.dayLabel}
                  </Text>
                  <Text fontSize="2xs" color="gray.500">
                    {d.minutes}m
                  </Text>
                </VStack>
              </VStack>
            );
          })}
        </HStack>
      </Box>

      {/* Series Pacing & Completion Forecast */}
      <Box
        p={5}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Heading size="sm" mb={4}>
          Course Series & Pacing Forecast
        </Heading>

        {seriesPacing.length === 0 ? (
          <Box p={6} textAlign="center" border="1px dashed" borderColor={borderColor} borderRadius="lg">
            <Text color={subtleText} fontSize="sm">
              No lecture series found. Create a series in the sidebar to start tracking course pacing.
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {seriesPacing.map((item) => {
              const remaining = item.totalLectures - item.completedLectures;
              const weeksRemaining =
                item.targetPerWeek > 0 ? Math.ceil(remaining / item.targetPerWeek) : 0;

              return (
                <Box
                  key={item.seriesId}
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  bg={cardHoverBg}
                  _hover={{ borderColor: 'green.400' }}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2} mb={2}>
                    <Box>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" fontSize="sm">
                          {item.title}
                        </Text>
                        <Badge colorScheme="green" fontSize="2xs">
                          {item.topic}
                        </Badge>
                      </HStack>
                      <Text fontSize="2xs" color="green.300">
                        {item.scholar}
                      </Text>
                    </Box>

                    {item.nextLecture ? (
                      <Button
                        size="xs"
                        colorScheme="green"
                        leftIcon={<FiPlay />}
                        onClick={() => handleContinueSeries(item)}
                      >
                        Continue: {item.nextLecture.title}
                      </Button>
                    ) : (
                      <Badge colorScheme="teal" fontSize="2xs">
                        Completed 🎉
                      </Badge>
                    )}
                  </Flex>

                  <Progress
                    value={item.completionPct}
                    colorScheme="green"
                    size="xs"
                    borderRadius="full"
                    mb={2}
                  />

                  <HStack justify="space-between" fontSize="2xs" color={subtleText}>
                    <Text>
                      {item.completedLectures} of {item.totalLectures} lectures completed ({item.completionPct}%)
                    </Text>
                    {remaining > 0 ? (
                      <Text color="yellow.400">
                        Target: {item.targetPerWeek}/wk • ~{weeksRemaining} {weeksRemaining === 1 ? 'week' : 'weeks'} remaining
                      </Text>
                    ) : (
                      <Text color="green.400">Course Mastered!</Text>
                    )}
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Spaced Repetition Review Queue (Muraja'ah) */}
      <Box
        p={5}
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <HStack justify="space-between" mb={4}>
          <HStack spacing={2}>
            <Icon as={FiRotateCw} color="yellow.400" />
            <Heading size="sm">Spaced Repetition Review Queue (مُرَاجَعَة)</Heading>
          </HStack>
          <Badge colorScheme={reviews.filter((r) => r.isDue).length > 0 ? 'red' : 'green'}>
            {reviews.filter((r) => r.isDue).length} Due
          </Badge>
        </HStack>

        {reviews.length === 0 ? (
          <Box p={6} textAlign="center" border="1px dashed" borderColor={borderColor} borderRadius="lg">
            <Text color={subtleText} fontSize="sm">
              No reviews scheduled yet. Finish a lecture or study session to automatically queue it for review!
            </Text>
          </Box>
        ) : (
          <VStack spacing={2} align="stretch">
            {reviews.map((r) => (
              <Box
                key={r.id}
                p={3}
                borderRadius="lg"
                border="1px solid"
                borderColor={r.isDue ? 'red.500' : borderColor}
                bg={cardHoverBg}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <Box flex={1} minW="200px">
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {r.lectureTitle}
                      </Text>
                      <Badge colorScheme={r.isDue ? 'red' : 'gray'} fontSize="2xs">
                        {r.isDue ? 'Due Today' : `In ${r.intervalDays}d`}
                      </Badge>
                    </HStack>
                    <Text fontSize="2xs" color={subtleText}>
                      {r.seriesTitle} • Next Date: {r.nextReviewDate} (Interval: {r.intervalDays}d)
                    </Text>
                  </Box>

                  <HStack spacing={1}>
                    <Button
                      size="xs"
                      colorScheme="green"
                      leftIcon={<FiBookOpen />}
                      onClick={() => handleStartReview(r)}
                    >
                      Review
                    </Button>
                    <Tooltip label="Hard: review again in 1 day">
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => handleRateReview(r.lectureId, 'hard')}
                      >
                        Hard (1d)
                      </Button>
                    </Tooltip>
                    <Tooltip label="Good: double the interval">
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="yellow"
                        onClick={() => handleRateReview(r.lectureId, 'good')}
                      >
                        Good (3d+)
                      </Button>
                    </Tooltip>
                    <Tooltip label="Easy: triple the interval">
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="green"
                        onClick={() => handleRateReview(r.lectureId, 'easy')}
                      >
                        Easy (7d+)
                      </Button>
                    </Tooltip>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default Dashboard;
