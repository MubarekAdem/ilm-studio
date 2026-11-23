import React, { useState, useEffect, useRef } from 'react';
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
  FiMusic,
  FiFileText,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import PdfViewer from '../PdfViewer/PdfViewer';
import NoteEditor from '../NoteEditor/NoteEditor';
import Dashboard from '../Dashboard/Dashboard';
import { ErrorBoundary } from '../common/ErrorBoundary';

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
  const selectSeries = useAppStore((s) => s.selectSeries);
  const openImport = useAppStore((s) => s.openImport);
  const setView = useAppStore((s) => s.setView);
  const [stats, setStats] = useState<{ totalLectures: number; completedLectures: number } | null>(null);

  useEffect(() => {
    window.api.getStats().then((data) => {
      setStats({
        totalLectures: data.totalLectures,
        completedLectures: data.completedLectures,
      });
    }).catch(console.error);
  }, []);

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
          label="Total Lectures"
          value={stats ? stats.totalLectures : '...'}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Completed"
          value={stats ? stats.completedLectures : '...'}
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

              {/* Direct Add Audio / Add PDF actions */}
              <HStack
                mt={3}
                pt={2}
                borderTop="1px solid"
                borderColor={borderColor}
                justify="flex-end"
                spacing={2}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="2xs"
                  colorScheme="green"
                  variant="ghost"
                  leftIcon={<FiMusic />}
                  onClick={() => openImport({ tab: 'audio', seriesId: series.id })}
                >
                  + Add Audio
                </Button>
                <Button
                  size="2xs"
                  colorScheme="green"
                  variant="ghost"
                  leftIcon={<FiFileText />}
                  onClick={() => openImport({ tab: 'pdf', seriesId: series.id })}
                >
                  + Add PDF
                </Button>
              </HStack>
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

/** Study dual-pane view: PDF Viewer + Note Editor with resizable splitter & Zen Mode */
const StudyView: React.FC = () => {
  const selectedSeriesId = useAppStore((s) => s.selectedSeriesId);
  const seriesList = useAppStore((s) => s.seriesList);
  const openImport = useAppStore((s) => s.openImport);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const storeLecture = useAppStore((s) => s.currentLecture);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const refreshCurrentLecture = useAppStore((s) => s.refreshCurrentLecture);
  const pdfSplitRatio = useAppStore((s) => s.pdfSplitRatio);
  const setPdfSplitRatio = useAppStore((s) => s.setPdfSplitRatio);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (selectedLectureId) {
      refreshCurrentLecture();
    }
  }, [selectedLectureId, refreshCurrentLecture]);

  const lecture =
    (storeLecture?.id === selectedLectureId ? storeLecture : null) ||
    lecturesList.find((l) => l.id === selectedLectureId) ||
    null;

  // Effective PDF path: use the selected lecture's pdfPath if present;
  // otherwise, fall back to any textbook/PDF attached to this course series!
  const seriesTextbookPdf =
    lecturesList.find((l) => Boolean(l.pdfPath))?.pdfPath || null;
  const effectivePdfPath = lecture?.pdfPath || seriesTextbookPdf;
  const splitterBg = useColorModeValue('gray.200', 'whiteAlpha.100');
  const splitterHoverBg = useColorModeValue('green.400', 'green.500');
  const emptyCardBg = useColorModeValue('white', '#16213e');
  const emptyBorderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setPdfSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const currentSeries = seriesList.find((s) => s.id === selectedSeriesId);

  // If a course is selected but contains no lectures yet, render direct add buttons!
  if (selectedSeriesId && lecturesList.length === 0 && !lecture) {
    return (
      <Flex h="100%" w="100%" align="center" justify="center" p={8}>
        <VStack
          spacing={4}
          maxW="480px"
          textAlign="center"
          p={8}
          bg={emptyCardBg}
          borderRadius="xl"
          border="1px dashed"
          borderColor={emptyBorderColor}
          boxShadow="sm"
        >
          <Box p={4} borderRadius="full" bg="green.500" color="white">
            <Icon as={FiBook} boxSize={8} />
          </Box>
          <Heading size="md">{currentSeries?.title || 'Selected Course'}</Heading>
          <Text color="gray.400" fontSize="sm">
            This course currently has no lectures or textbooks attached. Add your first audio lecture or textbook PDF to start studying!
          </Text>
          <HStack spacing={3} pt={2}>
            <Button
              colorScheme="green"
              leftIcon={<FiMusic />}
              onClick={() => openImport({ tab: 'audio', seriesId: selectedSeriesId })}
            >
              Add Audio Lecture
            </Button>
            <Button
              colorScheme="green"
              variant="outline"
              leftIcon={<FiFileText />}
              onClick={() => openImport({ tab: 'pdf', seriesId: selectedSeriesId })}
            >
              Add PDF Textbook
            </Button>
          </HStack>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box position="relative" h="100%" w="100%" overflow="hidden">
      <Flex ref={containerRef} h="100%" direction="row" overflow="hidden">
        {/* Left Pane: PDF Matn / Textbook */}
        <Box
          w={`${pdfSplitRatio}%`}
          minW="320px"
          h="100%"
          overflow="hidden"
        >
          <ErrorBoundary fallbackTitle="PDF Viewer Error">
            <PdfViewer pdfPath={effectivePdfPath} />
          </ErrorBoundary>
        </Box>

        {/* Resizable Splitter Handle */}
        <Box
          w="6px"
          h="100%"
          bg={splitterBg}
          cursor="col-resize"
          position="relative"
          transition="background 0.15s ease"
          _hover={{ bg: splitterHoverBg }}
          _active={{ bg: splitterHoverBg }}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setPdfSplitRatio(55)}
          title="Drag to resize panes (Double-click to reset 55/45)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={5}
        >
          <Box w="2px" h="24px" bg="blackAlpha.300" borderRadius="full" />
        </Box>

        {/* Right Pane: TipTap Synchronized Note Editor */}
        <Box
          w={`${100 - pdfSplitRatio}%`}
          minW="320px"
          h="100%"
          overflow="hidden"
        >
          <ErrorBoundary fallbackTitle="Note Editor Error">
            <NoteEditor lectureId={selectedLectureId} />
          </ErrorBoundary>
        </Box>
      </Flex>
    </Box>
  );
};

export const MainContent: React.FC = () => {
  const currentView = useAppStore((s) => s.currentView);
  const bg = useColorModeValue('#faf8f5', '#1a1a2e');

  return (
    <Box flex={1} h="100%" bg={bg} overflow="hidden">
      {currentView === 'library' && <LibraryView />}
      {currentView === 'study' && <StudyView />}
      {currentView === 'dashboard' && <Dashboard />}
    </Box>
  );
};

export default MainContent;
