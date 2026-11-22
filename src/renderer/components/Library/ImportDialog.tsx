import React, { useState } from 'react';
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

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [copyToLibrary, setCopyToLibrary] = useState(true);
  const [importing, setImporting] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const seriesList = useAppStore((s) => s.seriesList);
  const loadSeries = useAppStore((s) => s.loadSeries);
  const loadLectures = useAppStore((s) => s.loadLectures);
  const toast = useToast();

  const modalBg = useColorModeValue('white', '#16213e');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');

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
      await window.api.importAudio({
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

      // Refresh data
      loadSeries();
      if (selectedSeriesId) loadLectures(selectedSeriesId);

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
      await window.api.importPdf({
        filePath: pdfFile,
        lectureId: selectedSeriesId || null, // associate with current context
        copyToLibrary,
      });

      toast({
        title: 'PDF imported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

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
    setCopyToLibrary(true);
    setTabIndex(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="lg" isCentered>
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
