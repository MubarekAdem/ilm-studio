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
  StatHelpText,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiBook, FiClock, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import PdfViewer from '../PdfViewer/PdfViewer';
import NoteEditor from '../NoteEditor/NoteEditor';

/** Quick stat card for the library welcome screen */
const StatCard: React.FC<{
  label: string;
  value: string | number;
  helpText?: string;
  icon: React.ElementType;
}> = ({ label, value, helpText, icon }) => {
  const cardBg = useColorModeValue('white', '#16213e');
  return (
    <Box bg={cardBg} p={5} borderRadius="lg" boxShadow="sm">
      <HStack spacing={3} mb={2}>
        <Icon as={icon} boxSize={5} color="green.400" />
        <Stat>
          <StatLabel color="gray.500">{label}</StatLabel>
          <StatNumber fontSize="2xl">{value}</StatNumber>
          {helpText && <StatHelpText>{helpText}</StatHelpText>}
        </Stat>
      </HStack>
    </Box>
  );
};

/** Welcome / Library view */
const LibraryView: React.FC = () => {
  const seriesList = useAppStore((s) => s.seriesList);
  const lecturesList = useAppStore((s) => s.lecturesList);

  return (
    <VStack align="stretch" spacing={8} p={8} maxW="900px" mx="auto">
      <Box>
        <Heading size="lg" mb={1}>
          بسم الله الرحمن الرحيم
        </Heading>
        <Text color="gray.400" fontSize="lg">
          Welcome to Ilm Studio — your personal Islamic lecture study companion.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <StatCard
          icon={FiBook}
          label="Series"
          value={seriesList.length}
          helpText="Total series"
        />
        <StatCard
          icon={FiBook}
          label="Lectures"
          value={lecturesList.length}
          helpText="In current view"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Completed"
          value={lecturesList.filter((l) => l.completionPct > 90).length}
        />
        <StatCard
          icon={FiTrendingUp}
          label="In Progress"
          value={
            lecturesList.filter(
              (l) => l.completionPct > 0 && l.completionPct <= 90
            ).length
          }
        />
      </SimpleGrid>

      <Box>
        <Heading size="md" mb={2}>
          Quick Start
        </Heading>
        <Text color="gray.400">
          Select a series from the sidebar or click <strong>Import</strong> to
          add new lectures and study materials.
        </Text>
      </Box>
    </VStack>
  );
};

/** Study dual-pane view */
const StudyView: React.FC = () => {
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const lecture = lecturesList.find((l) => l.id === selectedLectureId) ?? null;

  return (
    <Flex h="100%" direction={{ base: 'column', lg: 'row' }}>
      <Box flex={1} minH="0" overflow="auto" borderRight="1px solid" borderColor="whiteAlpha.100">
        <PdfViewer pdfPath={lecture?.pdfPath ?? null} />
      </Box>
      <Box
        w={{ base: '100%', lg: '400px' }}
        minW={{ lg: '350px' }}
        overflow="auto"
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
      <Icon as={FiBarChart2} boxSize={16} color="gray.500" />
      <Heading size="md" color="gray.500">
        Dashboard
      </Heading>
      <Text color="gray.500" textAlign="center" maxW="400px">
        Study analytics, streaks, and review schedules will appear here in a
        future update.
      </Text>
    </VStack>
  );
};

// Need the icon imported for DashboardView
import { FiBarChart2 } from 'react-icons/fi';

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
