import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Input,
  Text,
  Checkbox,
  FormControl,
  FormLabel,
  Select,
  Icon,
  Box,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiMusic, FiFileText } from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';

interface ImportDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const isStoreImportOpen = useAppStore((s) => s.isImportOpen);
  const closeStoreImport = useAppStore((s) => s.closeImport);
  const importInitialTab = useAppStore((s) => s.importInitialTab);
  const importInitialSeriesId = useAppStore((s) => s.importInitialSeriesId);

  const effectiveIsOpen = isOpen !== undefined ? isOpen : isStoreImportOpen;
  const effectiveOnClose = onClose || closeStoreImport;

  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [copyToLibrary, setCopyToLibrary] = useState(true);
  const [importing, setImporting] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const seriesList = useAppStore((s) => s.seriesList);
  const currentSelectedSeriesId = useAppStore((s) => s.selectedSeriesId);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const selectSeries = useAppStore((s) => s.selectSeries);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const loadSeries = useAppStore((s) => s.loadSeries);
  const loadLectures = useAppStore((s) => s.loadLectures);
  const refreshCurrentLecture = useAppStore((s) => s.refreshCurrentLecture);
  const play = usePlayerStore((s) => s.play);

  const [pdfLectureId, setPdfLectureId] = useState('');
  const [pdfSeriesId, setPdfSeriesId] = useState('');
  const [seriesLectures, setSeriesLectures] = useState<{ id: string; title: string }[]>([]);

  // Pre-fill series and tab when dialog opens
  useEffect(() => {
    if (effectiveIsOpen) {
      const targetSeries = importInitialSeriesId || currentSelectedSeriesId || '';
      setSelectedSeriesId(targetSeries);
      setPdfSeriesId(targetSeries);
      setTabIndex(importInitialTab === 'pdf' ? 1 : 0);
    }
  }, [effectiveIsOpen, importInitialTab, importInitialSeriesId, currentSelectedSeriesId]);

  // Update lectures dropdown when pdfSeriesId changes
  useEffect(() => {
    let active = true;
    const filterId = pdfSeriesId || undefined;
    window.api.getLectures(filterId).then((lecs) => {
      if (active) {
        setSeriesLectures(lecs.map((l) => ({ id: l.id, title: l.title })));
        if (selectedLectureId && lecs.some((l) => l.id === selectedLectureId)) {
          setPdfLectureId(selectedLectureId);
        }
      }
    }).catch(console.error);
    return () => { active = false; };
  }, [pdfSeriesId, selectedLectureId, effectiveIsOpen]);
  const toast = useToast();

  const modalBg = useColorModeValue('#ffffff', '#181818');
  const inputBg = useColorModeValue('#f7f7f7', 'rgba(255, 255, 255, 0.04)');

  const handlePickAudio = async () => {
    try {
      const result = await window.api.openFileDialog({
        filters: [
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
        ],
        properties: ['openFile'],
      });
      if (result && result.length > 0) {
        setAudioFile(result[0]);
        // Auto-fill title from filename if empty
        if (!lectureTitle) {
          const filename = result[0].split(/[\\/]/).pop() || '';
          const name = filename.replace(/\.[^.]+$/, '');
          setLectureTitle(name);
        }
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handlePickPdf = async () => {
    try {
      const result = await window.api.openFileDialog({
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
        ],
        properties: ['openFile'],
      });
      if (result && result.length > 0) {
        setPdfFile(result[0]);
      }
    } catch (err) {
      console.error('File dialog error:', err);
    }
  };

  const handleImportAudio = async () => {
    if (!audioFile) return;
    setImporting(true);

    try {
      const created = await window.api.importAudio({
        filePath: audioFile,
        title: lectureTitle || 'Untitled Lecture',
        seriesId: selectedSeriesId || null,
        copyToLibrary,
      });

      toast({
        title: 'Audio imported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh series and lectures
      await loadSeries();
      if (selectedSeriesId) {
        selectSeries(selectedSeriesId);
        await loadLectures(selectedSeriesId);
      }

      if (created?.id) {
        selectLecture(created.id);
        usePlayerStore.setState({ currentLecture: created });
        await refreshCurrentLecture();
        setView('study');
        if (created.audioPath) {
          play(created);
        }
      }

      resetAndClose();
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: 'Import failed',
        description: String(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportPdf = async () => {
    if (!pdfFile) return;
    setImporting(true);

    try {
      let targetLectureId = pdfLectureId === '__NEW__' ? '' : pdfLectureId;
      const effectiveSeriesId = pdfSeriesId || selectedSeriesId || null;

      // If no specific lecture was picked (or default "Course Textbook" was chosen)
      if (!targetLectureId) {
        if (effectiveSeriesId && seriesLectures.length > 0 && pdfLectureId !== '__NEW__') {
          // Attach to existing lectures in this course!
          targetLectureId = seriesLectures[0].id;
        } else {
          const rawName = pdfFile.split(/[\\/]/).pop()?.replace(/\.pdf$/i, '') || 'Textbook / Matn';
          const created = await window.api.createLecture({
            seriesId: effectiveSeriesId,
            title: rawName,
            orderIndex: 0,
            audioPath: null,
            pdfPath: null,
            isCopied: copyToLibrary,
            duration: 0,
            lastPosition: 0,
            completionPct: 0,
          });
          targetLectureId = created.id;
        }
      }

      const result = await window.api.importPdf({
        filePath: pdfFile,
        lectureId: targetLectureId,
        copyToLibrary,
      });

      // If course textbook mode (shared across all lessons in this course),
      // update all existing lessons in this course to share this textbook PDF path!
      if (effectiveSeriesId && pdfLectureId !== '__NEW__' && seriesLectures.length > 0 && result?.path) {
        for (const l of seriesLectures) {
          window.api.updateLecture(l.id, { pdfPath: result.path }).catch(console.error);
        }
      }

      toast({
        title: 'PDF imported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh series & lectures
      await loadSeries();
      if (effectiveSeriesId) {
        selectSeries(effectiveSeriesId);
        await loadLectures(effectiveSeriesId);
      }

      if (targetLectureId) {
        selectLecture(targetLectureId);
        const refreshed = await window.api.getLecture(targetLectureId);
        if (refreshed) {
          const playerState = usePlayerStore.getState();
          if (playerState.currentLecture?.id === refreshed.id) {
            // Same lecture: merge new pdfPath into currentLecture without interrupting audio
            usePlayerStore.setState({
              currentLecture: { ...playerState.currentLecture, ...refreshed },
            });
          } else if (!playerState.isPlaying && refreshed.audioPath) {
            usePlayerStore.setState({ currentLecture: refreshed });
          }
        }
        await refreshCurrentLecture();
        setView('study');
      }

      resetAndClose();
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: 'Import failed',
        description: String(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setAudioFile(null);
    setPdfFile(null);
    setLectureTitle('');
    setSelectedSeriesId('');
    setPdfLectureId('');
    setPdfSeriesId('');
    setCopyToLibrary(true);
    setTabIndex(0);
    effectiveOnClose();
  };

  return (
    <Modal isOpen={effectiveIsOpen} onClose={resetAndClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg}>
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={FiUpload} color="green.400" />
            <Text>Import Files</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            colorScheme="green"
            variant="enclosed"
          >
            <TabList>
              <Tab>
                <HStack spacing={1}>
                  <Icon as={FiMusic} boxSize={4} />
                  <Text>Import Audio</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={1}>
                  <Icon as={FiFileText} boxSize={4} />
                  <Text>Import PDF</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Audio import */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Button
                      w="100%"
                      variant="outline"
                      colorScheme="green"
                      leftIcon={<FiFile />}
                      onClick={handlePickAudio}
                      py={8}
                    >
                      {audioFile
                        ? audioFile.split(/[\\/]/).pop()
                        : 'Choose Audio File'}
                    </Button>
                  </Box>

                  <FormControl>
                    <FormLabel fontSize="sm">Lecture Title</FormLabel>
                    <Input
                      value={lectureTitle}
                      onChange={(e) => setLectureTitle(e.target.value)}
                      placeholder="Enter lecture title"
                      bg={inputBg}
                      size="sm"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">
                      Assign to Series (optional)
                    </FormLabel>
                    <Select
                      value={selectedSeriesId}
                      onChange={(e) => setSelectedSeriesId(e.target.value)}
                      placeholder="None — standalone lecture"
                      bg={inputBg}
                      size="sm"
                    >
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <Checkbox
                    isChecked={copyToLibrary}
                    onChange={(e) => setCopyToLibrary(e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  >
                    Copy file to library
                  </Checkbox>
                </VStack>
              </TabPanel>

              {/* PDF import */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Button
                      w="100%"
                      variant="outline"
                      colorScheme="green"
                      leftIcon={<FiFile />}
                      onClick={handlePickPdf}
                      py={8}
                    >
                      {pdfFile
                        ? pdfFile.split(/[\\/]/).pop()
                        : 'Choose PDF File'}
                    </Button>
                  </Box>

                  <FormControl>
                    <FormLabel fontSize="sm">Course / Series</FormLabel>
                    <Select
                      value={pdfSeriesId}
                      onChange={(e) => {
                        setPdfSeriesId(e.target.value);
                        setPdfLectureId('');
                      }}
                      placeholder="Standalone (no course)"
                      bg={inputBg}
                      size="sm"
                    >
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">
                      {seriesLectures.length > 0
                        ? 'Target Lecture'
                        : 'Lecture Action'}
                    </FormLabel>
                    {seriesLectures.length > 0 ? (
                      <Select
                        value={pdfLectureId}
                        onChange={(e) => setPdfLectureId(e.target.value)}
                        placeholder="✨ Set as Course Textbook (Shared across all lessons)"
                        bg={inputBg}
                        size="sm"
                      >
                        {seriesLectures.map((l) => (
                          <option key={l.id} value={l.id}>
                            Attach specifically to: {l.title}
                          </option>
                        ))}
                        <option value="__NEW__">+ Create as separate standalone item</option>
                      </Select>
                    ) : (
                      <Text fontSize="xs" color="gray.400">
                        Will automatically create a new lecture named after this PDF in the course.
                      </Text>
                    )}
                  </FormControl>

                  <Checkbox
                    isChecked={copyToLibrary}
                    onChange={(e) => setCopyToLibrary(e.target.checked)}
                    colorScheme="green"
                    size="sm"
                  >
                    Copy file to library
                  </Checkbox>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={resetAndClose} size="sm">
            Cancel
          </Button>
          <Button
            colorScheme="green"
            size="sm"
            isLoading={importing}
            isDisabled={tabIndex === 0 ? !audioFile : !pdfFile}
            onClick={tabIndex === 0 ? handleImportAudio : handleImportPdf}
          >
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportDialog;
