import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Badge,
  Button,
} from '@chakra-ui/react';
import {
  FiBook,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart2,
  FiFolder,
  FiPlay,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import PdfViewer from '../PdfViewer/PdfViewer';
import NoteEditor from '../NoteEditor/NoteEditor';

/** Quick stat card for the library welcome screen */
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
}> = ({ label, value, icon }) => {
  const cardBg = useColorModeValue('white', '#16213e');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  return (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
    >
      <HStack spacing={3}>
        <Box
          p={2.5}
          borderRadius="md"
          bg="green.500"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={icon} boxSize={5} />
        </Box>
        <Stat>
          <StatLabel color="gray.400" fontSize="xs">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value}
          </StatNumber>
        </Stat>
      </HStack>
    </Box>
  );
};

/** Welcome / Library view */
const LibraryView: React.FC = () => {
  const seriesList = useAppStore((s) => s.seriesList);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const selectSeries = useAppStore((s) => s.selectSeries);
  const setView = useAppStore((s) => s.setView);

  const cardBg = useColorModeValue('white', '#16213e');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  return (
    <VStack align="stretch" spacing={6} p={8} maxW="1000px" mx="auto" overflowY="auto" h="100%">
      <Box>
        <Text fontSize="sm" color="green.400" fontWeight="bold" letterSpacing="wider">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <Heading size="lg" mt={1} mb={2}>
          Ilm Studio Library
        </Heading>
        <Text color="gray.400" fontSize="md">
          Organized Islamic lecture courses, textbooks, and interactive notes.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard
          icon={FiFolder}
          label="Total Courses"
          value={seriesList.length}
        />
        <StatCard
          icon={FiBook}
          label="Active Lectures"
          value={lecturesList.length}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Completed"
          value={lecturesList.filter((l) => l.completionPct >= 90).length}
        />
      </SimpleGrid>

      {/* Series Cards */}
      <Box>
        <Heading size="md" mb={4}>
          Course Series
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {seriesList.map((series) => (
            <Box
              key={series.id}
              p={5}
              bg={cardBg}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              cursor="pointer"
              _hover={{ transform: 'translateY(-2px)', borderColor: 'green.400', transition: 'all 0.2s' }}
              onClick={() => {
                selectSeries(series.id);
                setView('study');
              }}
            >
              <HStack justify="space-between" mb={2}>
                <Badge colorScheme="green" variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                  {series.topic || 'General Studies'}
                </Badge>
                <Text fontSize="2xs" color="gray.400">
                  {series.totalLectures} lectures
                </Text>
              </HStack>
              <Heading size="sm" mb={1} noOfLines={1}>
                {series.title}
              </Heading>
              {series.scholar && (
                <Text fontSize="xs" color="green.300" fontWeight="medium" mb={2}>
                  Teacher: {series.scholar}
                </Text>
              )}
              {series.description && (
                <Text fontSize="xs" color="gray.400" noOfLines={2}>
                  {series.description}
                </Text>
              )}
            </Box>
          ))}
          {seriesList.length === 0 && (
            <Box p={8} bg={cardBg} borderRadius="lg" border="1px dashed" borderColor={borderColor} textAlign="center">
              <Text color="gray.400" fontSize="sm">
                No lecture series added yet. Click <strong>Import Audio / PDF</strong> in the sidebar or create a course.
              </Text>
            </Box>
          )}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};

/** Study dual-pane view: PDF Viewer + Note Editor */
const StudyView: React.FC = () => {
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const lecture = lecturesList.find((l) => l.id === selectedLectureId) ?? null;

  return (
    <Flex h="100%" direction={{ base: 'column', md: 'row' }} overflow="hidden">
      {/* Left Pane: PDF Matn / Textbook */}
      <Box
        flex={{ base: '1', md: '6' }}
        minW="0"
        h="100%"
        borderRight="1px solid"
        borderColor="whiteAlpha.100"
        overflow="hidden"
      >
        <PdfViewer pdfPath={lecture?.pdfPath ?? null} />
      </Box>

      {/* Right Pane: TipTap Synchronized Note Editor */}
      <Box
        flex={{ base: '1', md: '5' }}
        minW={{ md: '380px' }}
        h="100%"
        overflow="hidden"
      >
        <NoteEditor lectureId={selectedLectureId} />
      </Box>
    </Flex>
  );
};

/** Dashboard placeholder */
const DashboardView: React.FC = () => {
  return (
    <VStack align="center" justify="center" h="100%" spacing={4} p={8}>
      <Icon as={FiBarChart2} boxSize={16} color="green.400" />
      <Heading size="md" color="gray.300">
        Study Analytics & Dashboard
      </Heading>
      <Text color="gray.400" textAlign="center" maxW="450px" fontSize="sm">
        Track study streaks, daily learning targets, and spaced repetition review schedules in Phase 5.
      </Text>
    </VStack>
  );
};

export const MainContent: React.FC = () => {
  const currentView = useAppStore((s) => s.currentView);
  const bg = useColorModeValue('#faf8f5', '#1a1a2e');

  return (
    <Box flex={1} h="100%" bg={bg} overflow="hidden">
      {currentView === 'library' && <LibraryView />}
      {currentView === 'study' && <StudyView />}
      {currentView === 'dashboard' && <DashboardView />}
    </Box>
  );
};

export default MainContent;
