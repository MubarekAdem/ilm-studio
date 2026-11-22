import React, { useEffect, useState } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  IconButton,
  Icon,
  Heading,
  useDisclosure,
  Collapse,
  Badge,
  Circle,
  Divider,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiBook,
  FiBarChart2,
  FiPlus,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import type { Series, Lecture } from '../../../shared/types';
import { ImportDialog } from '../Library/ImportDialog';

/** Completion indicator dot for a lecture */
const CompletionDot: React.FC<{ pct: number }> = ({ pct }) => {
  let color = 'gray.500';
  if (pct > 90) color = 'green.400';
  else if (pct > 0) color = 'yellow.400';
  return <Circle size="10px" bg={color} flexShrink={0} />;
};

/** A single series entry that expands to show lectures */
const SeriesItem: React.FC<{
  series: Series;
  lectures: Lecture[];
  isSelected: boolean;
  onSelect: () => void;
}> = ({ series, lectures, isSelected, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');

  const handleExpand = () => {
    setExpanded((prev) => !prev);
    onSelect();
  };

  return (
    <Box w="100%">
      <HStack
        px={3}
        py={2}
        cursor="pointer"
        borderRadius="md"
        bg={isSelected ? 'whiteAlpha.100' : 'transparent'}
        _hover={{ bg: hoverBg }}
        onClick={handleExpand}
        spacing={2}
      >
        <Icon
          as={expanded ? FiChevronDown : FiChevronRight}
          boxSize={4}
          color="gray.400"
        />
        <Text fontSize="sm" fontWeight="medium" noOfLines={1} flex={1}>
          {series.title}
        </Text>
        <Badge
          colorScheme="green"
          variant="subtle"
          fontSize="xs"
          borderRadius="full"
        >
          {series.totalLectures}
        </Badge>
      </HStack>

      <Collapse in={expanded} animateOpacity>
        <VStack align="stretch" pl={8} pr={3} spacing={0}>
          {lectures.map((lecture) => (
            <HStack
              key={lecture.id}
              py={1.5}
              px={2}
              cursor="pointer"
              borderRadius="md"
              bg={
                selectedLectureId === lecture.id
                  ? 'whiteAlpha.150'
                  : 'transparent'
              }
              _hover={{ bg: hoverBg }}
              onClick={() => {
                selectLecture(lecture.id);
                setView('study');
              }}
              spacing={2}
            >
              <CompletionDot pct={lecture.completionPct} />
              <Text fontSize="xs" noOfLines={1} flex={1} color="gray.300">
                {lecture.title}
              </Text>
            </HStack>
          ))}
          {lectures.length === 0 && (
            <Text fontSize="xs" color="gray.500" py={1} px={2}>
              No lectures yet
            </Text>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setView,
    seriesList,
    lecturesList,
    selectedSeriesId,
    selectSeries,
    loadSeries,
    loadLectures,
  } = useAppStore();

  const { isOpen: importOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();

  const surfaceBg = useColorModeValue('gray.50', '#16213e');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  // Load lectures whenever a series is selected
  useEffect(() => {
    if (selectedSeriesId) {
      loadLectures(selectedSeriesId);
    }
  }, [selectedSeriesId, loadLectures]);

  return (
    <>
      <VStack
        w="280px"
        minW="280px"
        h="100%"
        bg={surfaceBg}
        borderRight="1px solid"
        borderColor={borderColor}
        spacing={0}
        align="stretch"
        overflow="hidden"
      >
        {/* Logo */}
        <HStack px={4} py={5} spacing={3}>
          <Box
            w="36px"
            h="36px"
            borderRadius="lg"
            bg="green.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="lg" fontWeight="bold" color="white">
              عِ
            </Text>
          </Box>
          <Heading size="md" color="green.400" fontWeight="bold">
            Ilm Studio
          </Heading>
        </HStack>

        <Divider borderColor={borderColor} />

        {/* Navigation */}
        <VStack px={3} pt={4} pb={2} spacing={1} align="stretch">
          <Button
            variant={currentView === 'library' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'library' ? 'green' : undefined}
            justifyContent="flex-start"
            leftIcon={<FiBook />}
            size="sm"
            onClick={() => setView('library')}
          >
            Library
          </Button>
          <Button
            variant={currentView === 'dashboard' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'dashboard' ? 'green' : undefined}
            justifyContent="flex-start"
            leftIcon={<FiBarChart2 />}
            size="sm"
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </Button>
        </VStack>

        <Divider borderColor={borderColor} />

        {/* Series list */}
        <VStack
          flex={1}
          overflowY="auto"
          px={2}
          pt={3}
          spacing={1}
          align="stretch"
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
            },
          }}
        >
          <Text
            px={2}
            pb={1}
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
            color="gray.500"
          >
            Series
          </Text>
          {seriesList.map((series) => (
            <SeriesItem
              key={series.id}
              series={series}
              lectures={
                selectedSeriesId === series.id ? lecturesList : []
              }
              isSelected={selectedSeriesId === series.id}
              onSelect={() => selectSeries(series.id)}
            />
          ))}
          {seriesList.length === 0 && (
            <Text fontSize="sm" color="gray.500" px={3} py={4} textAlign="center">
              No series yet. Import lectures to get started.
            </Text>
          )}
        </VStack>

        <Divider borderColor={borderColor} />

        {/* Import button */}
        <Box p={3}>
          <Button
            w="100%"
            size="sm"
            colorScheme="green"
            leftIcon={<FiPlus />}
            onClick={onImportOpen}
          >
            Import
          </Button>
        </Box>
      </VStack>

      <ImportDialog isOpen={importOpen} onClose={onImportClose} />
    </>
  );
};

export default Sidebar;
