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
  MenuDivider,
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
  FiEdit2,
  FiSettings,
  FiTag,
  FiMusic,
  FiFileText,
} from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { Series, Lecture } from '../../../shared/types';
import { ImportDialog } from '../Library/ImportDialog';
import { CreateSeriesModal } from '../Library/CreateSeriesModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

/** Completion indicator dot for a lecture */
const CompletionDot: React.FC<{ pct: number }> = ({ pct }) => {
  let color = 'gray.500';
  if (pct >= 90) color = 'green.400';
  else if (pct > 0) color = 'yellow.400';
  return <Circle size="10px" bg={color} flexShrink={0} />;
};

interface SeriesItemProps {
  series: Series;
  lectures?: Lecture[];
  isSelected: boolean;
  onSelect: () => void;
  onEditSeries: (series: Series) => void;
  onDeleteSeries: (id: string) => void;
  onDeleteLecture: (id: string) => void;
}

/** A single series entry that expands to show lectures */
const SeriesItem: React.FC<SeriesItemProps> = ({
  series,
  lectures: propLectures,
  isSelected,
  onSelect,
  onEditSeries,
  onDeleteSeries,
  onDeleteLecture,
}) => {
  const [expanded, setExpanded] = useState(isSelected);
  const [courseLectures, setCourseLectures] = useState<Lecture[]>([]);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const openImport = useAppStore((s) => s.openImport);
  const play = usePlayerStore((s) => s.play);
  const hoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const emptyBoxBg = useColorModeValue('#f7f7f7', '#1a1a1a');
  const emptyBorderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.12)');

  const loadCourseLectures = React.useCallback(async () => {
    try {
      const data = await window.api.getLectures(series.id);
      setCourseLectures(data);
    } catch (e) {
      console.error('Failed to load lectures for series', series.id, e);
    }
  }, [series.id]);

  useEffect(() => {
    if (expanded || isSelected) {
      loadCourseLectures();
    }
  }, [expanded, isSelected, loadCourseLectures]);

  useEffect(() => {
    if (isSelected) {
      setExpanded(true);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isSelected && lecturesList && lecturesList.length > 0) {
      setCourseLectures(lecturesList);
    }
  }, [isSelected, lecturesList]);

  // Effective list of lectures for this course series
  const lectures =
    isSelected && lecturesList && lecturesList.length > 0
      ? lecturesList
      : courseLectures.length > 0
      ? courseLectures
      : propLectures || [];

  const handleExpand = () => {
    setExpanded((prev) => !prev);
    onSelect();
  };

  const handleSelectLecture = (lecture: Lecture) => {
    selectLecture(lecture.id);
    setView('study');
    if (lecture.audioPath) {
      const savedPosStr = localStorage.getItem(`ilm_last_audio_pos_${lecture.id}`);
      const pos = savedPosStr ? parseFloat(savedPosStr) : (lecture.lastPosition || 0);
      play({ ...lecture, lastPosition: pos });
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
          <MenuList minW="160px" py={1}>
            <MenuItem
              icon={<FiMusic />}
              fontSize="xs"
              onClick={() => openImport({ tab: 'audio', seriesId: series.id })}
            >
              Add Audio Lecture
            </MenuItem>
            <MenuItem
              icon={<FiFileText />}
              fontSize="xs"
              onClick={() => openImport({ tab: 'pdf', seriesId: series.id })}
            >
              Add PDF Textbook / Matn
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<FiEdit2 />}
              fontSize="xs"
              onClick={() => onEditSeries(series)}
            >
              Edit Course
            </MenuItem>
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
        <VStack align="stretch" pl={5} pr={2} py={1} spacing={0.5}>
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

          {/* Empty state: action buttons right inside the course */}
          {lectures.length === 0 && (
            <Box
              p={3}
              my={1}
              borderRadius="md"
              bg={emptyBoxBg}
              border="1px dashed"
              borderColor={emptyBorderColor}
              textAlign="center"
            >
              <Text fontSize="2xs" color="gray.400" mb={2}>
                Course is empty. Add lectures or textbook:
              </Text>
              <HStack spacing={2} justify="center">
                <Button
                  size="xs"
                  colorScheme="green"
                  variant="solid"
                  leftIcon={<FiMusic />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImport({ tab: 'audio', seriesId: series.id });
                  }}
                >
                  Add Audio
                </Button>
                <Button
                  size="xs"
                  colorScheme="green"
                  variant="outline"
                  leftIcon={<FiFileText />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImport({ tab: 'pdf', seriesId: series.id });
                  }}
                >
                  Add PDF
                </Button>
              </HStack>
            </Box>
          )}

          {/* Course has lectures: quick addition buttons */}
          {lectures.length > 0 && (
            <HStack spacing={1} pt={1} justify="flex-end">
              <Button
                size="2xs"
                variant="ghost"
                color="green.400"
                leftIcon={<FiPlus />}
                onClick={() => openImport({ tab: 'audio', seriesId: series.id })}
                title="Add audio to this course"
              >
                + Audio
              </Button>
              <Button
                size="2xs"
                variant="ghost"
                color="green.400"
                leftIcon={<FiPlus />}
                onClick={() => openImport({ tab: 'pdf', seriesId: series.id })}
                title="Add PDF to this course"
              >
                + PDF
              </Button>
            </HStack>
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
    setSettingsOpen,
    setTagManagerOpen,
    isFocusMode,
    selectLecture,
    openImport,
  } = useAppStore();

  const play = usePlayerStore((s) => s.play);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);

  const [seriesToDelete, setSeriesToDelete] = useState<string | null>(null);
  const [lectureToDelete, setLectureToDelete] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [standaloneLectures, setStandaloneLectures] = useState<Lecture[]>([]);

  const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
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

  const surfaceBg = useColorModeValue('#fdfdfd', '#141414');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');

  const loadStandaloneLectures = React.useCallback(async () => {
    try {
      const all = await window.api.getLectures();
      setStandaloneLectures(all.filter((l) => !l.seriesId));
    } catch (err) {
      console.error('Failed to load standalone lectures:', err);
    }
  }, []);

  useEffect(() => {
    loadSeries();
    loadStandaloneLectures();
  }, [loadSeries, loadStandaloneLectures]);

  useEffect(() => {
    if (selectedSeriesId) {
      loadLectures(selectedSeriesId);
    }
    loadStandaloneLectures();
  }, [selectedSeriesId, loadLectures, loadStandaloneLectures]);

  const confirmDeleteSeries = async () => {
    if (!seriesToDelete) return;
    try {
      await window.api.deleteSeries(seriesToDelete);
      toast({ title: 'Series deleted', status: 'info', duration: 2000, isClosable: true });
      loadSeries();
      setSeriesToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeleteLecture = async () => {
    if (!lectureToDelete) return;
    try {
      await window.api.deleteLecture(lectureToDelete);
      toast({ title: 'Lecture deleted', status: 'info', duration: 2000, isClosable: true });
      if (selectedSeriesId) loadLectures(selectedSeriesId);
      loadStandaloneLectures();
      setLectureToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <VStack
        w={isFocusMode ? '0px' : '280px'}
        minW={isFocusMode ? '0px' : '280px'}
        display={isFocusMode ? 'none' : 'flex'}
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
              borderRadius="9px"
              bg={colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="sm"
            >
              <Text fontSize="md" fontWeight="bold" color={colorMode === 'dark' ? '#030303' : 'white'}>
                عِ
              </Text>
            </Box>
            <Box>
              <Heading size="sm" color={colorMode === 'dark' ? '#3ecf8e' : '#0e7e4e'} fontWeight="bold" letterSpacing="tight">
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

          <Button
            variant="ghost"
            justifyContent="space-between"
            leftIcon={<FiTag />}
            size="sm"
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            onClick={() => setTagManagerOpen(true)}
          >
            <Text fontSize="xs">Tags & Topics</Text>
          </Button>

          <Button
            variant="ghost"
            justifyContent="space-between"
            leftIcon={<FiSettings />}
            size="sm"
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            onClick={() => setSettingsOpen(true)}
          >
            <Text fontSize="xs">Settings</Text>
            <Badge fontSize="2xs" colorScheme="gray" variant="subtle">Ctrl+,</Badge>
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
              onEditSeries={(s) => setEditingSeries(s)}
              onDeleteSeries={(id) => setSeriesToDelete(id)}
              onDeleteLecture={(id) => setLectureToDelete(id)}
            />
          ))}
          {/* Standalone Lectures (Not part of a series) */}
          {standaloneLectures.length > 0 && (
            <Box pt={2}>
              <Text
                px={2}
                py={1}
                fontSize="3xs"
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="gray.400"
              >
                Standalone Lectures ({standaloneLectures.length})
              </Text>
              <VStack align="stretch" spacing={0.5}>
                {standaloneLectures.map((lecture) => (
                  <HStack
                    key={lecture.id}
                    py={1.5}
                    px={2}
                    cursor="pointer"
                    borderRadius="md"
                    bg={selectedLectureId === lecture.id ? 'whiteAlpha.200' : 'transparent'}
                    _hover={{ bg: hoverBg }}
                    spacing={2}
                    justify="space-between"
                  >
                    <HStack
                      spacing={2}
                      flex={1}
                      minW={0}
                      onClick={() => {
                        selectSeries(null);
                        selectLecture(lecture.id);
                        setView('study');
                        if (lecture.audioPath) {
                          play(lecture);
                        }
                      }}
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
                          onClick={() => setLectureToDelete(lecture.id)}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {seriesList.length === 0 && standaloneLectures.length === 0 && (
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
            onClick={() => openImport()}
          >
            Import Audio / PDF
          </Button>
        </Box>
      </VStack>

      <CreateSeriesModal isOpen={newSeriesOpen} onClose={onNewSeriesClose} />
      <CreateSeriesModal
        isOpen={Boolean(editingSeries)}
        onClose={() => setEditingSeries(null)}
        series={editingSeries}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(seriesToDelete)}
        onClose={() => setSeriesToDelete(null)}
        onConfirm={confirmDeleteSeries}
        title="Delete Lecture Series"
        message="Are you sure you want to delete this course series? Its lectures will be preserved as standalone items."
        confirmText="Delete Series"
      />

      <ConfirmDialog
        isOpen={Boolean(lectureToDelete)}
        onClose={() => setLectureToDelete(null)}
        onConfirm={confirmDeleteLecture}
        title="Delete Lecture"
        message="Are you sure you want to delete this lecture? All associated notes, bookmarks, and chapters will be permanently removed."
        confirmText="Delete Lecture"
      />
    </>
  );
};

export default Sidebar;
