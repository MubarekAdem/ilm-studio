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
  useColorMode,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import {
  FiBook,
  FiBarChart2,
  FiPlus,
  FiChevronDown,
  FiChevronRight,
  FiMoon,
  FiSun,
  FiMoreVertical,
  FiTrash2,
  FiFolderPlus,
  FiSearch,
  FiBookOpen,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { Series, Lecture } from '../../../shared/types';
import { ImportDialog } from '../Library/ImportDialog';
import { CreateSeriesModal } from '../Library/CreateSeriesModal';

/** Completion indicator dot for a lecture */
const CompletionDot: React.FC<{ pct: number }> = ({ pct }) => {
  let color = 'gray.500';
  if (pct >= 90) color = 'green.400';
  else if (pct > 0) color = 'yellow.400';
  return <Circle size="10px" bg={color} flexShrink={0} />;
};

/** A single series entry that expands to show lectures */
const SeriesItem: React.FC<{
  series: Series;
  lectures: Lecture[];
  isSelected: boolean;
  onSelect: () => void;
  onDeleteSeries: (id: string) => void;
  onDeleteLecture: (id: string) => void;
}> = ({ series, lectures, isSelected, onSelect, onDeleteSeries, onDeleteLecture }) => {
  const [expanded, setExpanded] = useState(false);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const play = usePlayerStore((s) => s.play);
  const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');

  const handleExpand = () => {
    setExpanded((prev) => !prev);
    onSelect();
  };

  const handleSelectLecture = (lecture: Lecture) => {
    selectLecture(lecture.id);
    setView('study');
    if (lecture.audioPath) {
      play(lecture);
    }
  };

  return (
    <Box w="100%">
      <HStack
        px={2}
        py={1.5}
        cursor="pointer"
        borderRadius="md"
        bg={isSelected ? 'whiteAlpha.150' : 'transparent'}
        _hover={{ bg: hoverBg }}
        spacing={2}
        justify="space-between"
      >
        <HStack spacing={2} flex={1} minW={0} onClick={handleExpand}>
          <Icon
            as={expanded ? FiChevronDown : FiChevronRight}
            boxSize={3.5}
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

        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Series options"
            icon={<FiMoreVertical />}
            size="xs"
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList minW="130px" py={1}>
            <MenuItem
              icon={<FiTrash2 />}
              color="red.400"
              fontSize="xs"
              onClick={() => onDeleteSeries(series.id)}
            >
              Delete Series
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      <Collapse in={expanded} animateOpacity>
        <VStack align="stretch" pl={6} pr={2} py={1} spacing={0.5}>
          {lectures.map((lecture) => (
            <HStack
              key={lecture.id}
              py={1.5}
              px={2}
              cursor="pointer"
              borderRadius="md"
              bg={
                selectedLectureId === lecture.id
                  ? 'whiteAlpha.200'
                  : 'transparent'
              }
              _hover={{ bg: hoverBg }}
              spacing={2}
              justify="space-between"
            >
              <HStack
                spacing={2}
                flex={1}
                minW={0}
                onClick={() => handleSelectLecture(lecture)}
              >
                <CompletionDot pct={lecture.completionPct} />
                <Text
                  fontSize="xs"
                  noOfLines={1}
                  flex={1}
                  color={selectedLectureId === lecture.id ? 'green.300' : 'gray.300'}
                  fontWeight={selectedLectureId === lecture.id ? 'bold' : 'normal'}
                >
                  {lecture.title}
                </Text>
              </HStack>

              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Lecture options"
                  icon={<FiMoreVertical />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList minW="120px" py={1}>
                  <MenuItem
                    icon={<FiTrash2 />}
                    color="red.400"
                    fontSize="xs"
                    onClick={() => onDeleteLecture(lecture.id)}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
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
    setSearchOpen,
    setQuranOpen,
  } = useAppStore();

  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const {
    isOpen: importOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();

  const {
    isOpen: newSeriesOpen,
    onOpen: onNewSeriesOpen,
    onClose: onNewSeriesClose,
  } = useDisclosure();

  const surfaceBg = useColorModeValue('gray.50', '#16213e');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  useEffect(() => {
    if (selectedSeriesId) {
      loadLectures(selectedSeriesId);
    }
  }, [selectedSeriesId, loadLectures]);

  const handleDeleteSeries = async (id: string) => {
    try {
      await window.api.deleteSeries(id);
      toast({ title: 'Series deleted', status: 'info', duration: 2000, isClosable: true });
      loadSeries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    try {
      await window.api.deleteLecture(id);
      toast({ title: 'Lecture deleted', status: 'info', duration: 2000, isClosable: true });
      if (selectedSeriesId) loadLectures(selectedSeriesId);
    } catch (e) {
      console.error(e);
    }
  };

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
        {/* Top Header: Logo + Theme toggle */}
        <HStack px={4} py={4} justify="space-between">
          <HStack spacing={2.5}>
            <Box
              w="32px"
              h="32px"
              borderRadius="lg"
              bg="green.600"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="md"
            >
              <Text fontSize="md" fontWeight="bold" color="white">
                عِ
              </Text>
            </Box>
            <Box>
              <Heading size="sm" color="green.400" fontWeight="bold" letterSpacing="wide">
                Ilm Studio
              </Heading>
              <Text fontSize="2xs" color="gray.400">
                عِلم ستوديو
              </Text>
            </Box>
          </HStack>

          <Tooltip label={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              aria-label="Toggle theme"
              icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
              size="sm"
              variant="ghost"
              onClick={toggleColorMode}
            />
          </Tooltip>
        </HStack>

        <Divider borderColor={borderColor} />

        {/* Navigation */}
        <VStack px={3} pt={3} pb={2} spacing={1} align="stretch">
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
            variant={currentView === 'study' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'study' ? 'green' : undefined}
            justifyContent="flex-start"
            leftIcon={<Icon as={FiBook} />}
            size="sm"
            onClick={() => setView('study')}
          >
            Study Workspace
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

          <Button
            variant="ghost"
            justifyContent="space-between"
            leftIcon={<FiSearch />}
            size="sm"
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            onClick={() => setSearchOpen(true)}
          >
            <Text fontSize="xs">Quick Search</Text>
            <Badge fontSize="2xs" colorScheme="gray" variant="subtle">Ctrl+K</Badge>
          </Button>

          <Button
            variant="ghost"
            justifyContent="space-between"
            leftIcon={<FiBookOpen />}
            size="sm"
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            onClick={() => setQuranOpen(true)}
          >
            <Text fontSize="xs">Quran Lookup</Text>
            <Badge fontSize="2xs" colorScheme="green" variant="subtle">Ctrl+Q</Badge>
          </Button>
        </VStack>

        <Divider borderColor={borderColor} />

        {/* Series Section Header with New Series Button */}
        <HStack px={3} pt={3} pb={1} justify="space-between">
          <Text
            fontSize="2xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
            color="gray.400"
          >
            Courses & Series
          </Text>
          <Tooltip label="Create New Series">
            <IconButton
              aria-label="Create series"
              icon={<FiFolderPlus />}
              size="xs"
              variant="ghost"
              colorScheme="green"
              onClick={onNewSeriesOpen}
            />
          </Tooltip>
        </HStack>

        {/* Series list */}
        <VStack
          flex={1}
          overflowY="auto"
          px={2}
          py={1}
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
          {seriesList.map((series) => (
            <SeriesItem
              key={series.id}
              series={series}
              lectures={
                selectedSeriesId === series.id ? lecturesList : []
              }
              isSelected={selectedSeriesId === series.id}
              onSelect={() => selectSeries(series.id)}
              onDeleteSeries={handleDeleteSeries}
              onDeleteLecture={handleDeleteLecture}
            />
          ))}
          {seriesList.length === 0 && (
            <VStack py={6} px={4} spacing={2} textAlign="center">
              <Text fontSize="xs" color="gray.500">
                No lecture series created yet.
              </Text>
              <Button
                size="xs"
                variant="outline"
                colorScheme="green"
                leftIcon={<FiFolderPlus />}
                onClick={onNewSeriesOpen}
              >
                Create Series
              </Button>
            </VStack>
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
            Import Audio / PDF
          </Button>
        </Box>
      </VStack>

      <ImportDialog isOpen={importOpen} onClose={onImportClose} />
      <CreateSeriesModal isOpen={newSeriesOpen} onClose={onNewSeriesClose} />
    </>
  );
};

export default Sidebar;
