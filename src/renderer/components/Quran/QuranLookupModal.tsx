import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  VStack,
  HStack,
  Text,
  Box,
  Button,
  IconButton,
  Tooltip,
  Badge,
  useToast,
  useColorModeValue,
  Select,
  InputGroup,
  InputLeftElement,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiSearch, FiBookOpen, FiCopy, FiPlusCircle } from 'react-icons/fi';
import type { Surah, Ayah } from '../../../shared/types';

interface QuranLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertAyah?: (ayah: Ayah) => void;
}

export const QuranLookupModal: React.FC<QuranLookupModalProps> = ({
  isOpen,
  onClose,
  onInsertAyah,
}) => {
  const [query, setQuery] = useState('');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | ''>('');
  const [results, setResults] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const modalBg = useColorModeValue('#ffffff', '#181818');
  const cardBg = useColorModeValue('#f7f7f7', '#222222');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');

  // Load surah list on open
  useEffect(() => {
    if (isOpen) {
      window.api.getSurahs().then(setSurahs).catch(console.error);
      // Default to Ayat al-Kursi (2:255) as a nice showcase
      if (results.length === 0) {
        window.api.getAyah('2:255').then((a) => {
          if (a) setResults([a]);
        });
      }
    }
  }, [isOpen]);

  // Execute search
  const handleSearch = async (searchTerm = query) => {
    if (!searchTerm.trim() && !selectedSurah) return;
    setLoading(true);

    try {
      let q = searchTerm.trim();
      if (!q && selectedSurah) {
        q = String(selectedSurah);
      }
      const data = await window.api.searchQuran(q, 20);
      setResults(data);
    } catch (err) {
      console.error('Quran search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahSelect = async (surahId: number) => {
    setSelectedSurah(surahId);
    setQuery('');
    setLoading(true);
    try {
      const data = await window.api.searchQuran(String(surahId), 30);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (ayah: Ayah) => {
    const textToCopy = `${ayah.text_uthmani}\n\n"${ayah.translation_en}"\n— [Surah ${ayah.surah_name_simple || ''} ${ayah.verse_key}]`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard',
      description: `Ayah ${ayah.verse_key}`,
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'bottom',
    });
  };

  const handleInsert = (ayah: Ayah) => {
    if (onInsertAyah) {
      onInsertAyah(ayah);
      toast({
        title: 'Inserted into notes',
        description: `Ayah ${ayah.verse_key}`,
        status: 'success',
        duration: 1500,
        isClosable: true,
        position: 'bottom',
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.750" />
      <ModalContent bg={modalBg} maxH="85vh">
        <ModalHeader pb={2}>
          <HStack justify="space-between" pr={6}>
            <HStack spacing={2.5}>
              <Icon as={FiBookOpen} color="green.400" boxSize={5} />
              <Box>
                <Text fontSize="md" fontWeight="bold">
                  Quran Verse Lookup
                </Text>
                <Text fontSize="2xs" color="gray.400">
                  100% Offline • Uthmani Script & English Translation
                </Text>
              </Box>
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pt={2} pb={6}>
          {/* Search Inputs */}
          <VStack spacing={3} align="stretch" mb={4}>
            <HStack spacing={2}>
              <InputGroup size="sm" flex={2}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="e.g. 2:255, 112:1, or keywords ('mercy', 'patience')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  variant="filled"
                />
              </InputGroup>

              <Select
                placeholder="Browse Surah..."
                size="sm"
                flex={1}
                value={selectedSurah}
                onChange={(e) => handleSurahSelect(Number(e.target.value))}
                variant="filled"
              >
                {surahs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name_simple} ({s.name_arabic})
                  </option>
                ))}
              </Select>

              <Button
                size="sm"
                colorScheme="green"
                onClick={() => handleSearch()}
                isLoading={loading}
              >
                Search
              </Button>
            </HStack>
          </VStack>

          <Divider borderColor={borderColor} mb={4} />

          {/* Results List */}
          <VStack spacing={3.5} align="stretch" maxH="55vh" overflowY="auto" pr={1}>
            {results.map((ayah) => (
              <Box
                key={ayah.id}
                p={4}
                bg={cardBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
                boxShadow="xs"
              >
                {/* Header row */}
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <Badge colorScheme="green" fontSize="2xs" px={2} py={0.5} borderRadius="full">
                      {ayah.verse_key}
                    </Badge>
                    <Text fontSize="xs" fontWeight="bold" color="green.300">
                      {ayah.surah_name_simple}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      ({ayah.surah_name_arabic})
                    </Text>
                  </HStack>

                  <HStack spacing={1}>
                    <Tooltip label="Copy Arabic & English">
                      <IconButton
                        aria-label="Copy ayah"
                        icon={<FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleCopy(ayah)}
                      />
                    </Tooltip>
                    {onInsertAyah && (
                      <Tooltip label="Insert into active note">
                        <Button
                          size="xs"
                          colorScheme="green"
                          variant="solid"
                          leftIcon={<FiPlusCircle />}
                          onClick={() => handleInsert(ayah)}
                        >
                          Insert
                        </Button>
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>

                {/* Uthmani Arabic Text */}
                <Box mb={3} dir="rtl" textAlign="right">
                  <Text
                    fontSize="xl"
                    lineHeight="2.2"
                    fontFamily="'Amiri', 'Traditional Arabic', serif"
                    color="gray.100"
                    fontWeight="medium"
                  >
                    {ayah.text_uthmani}
                  </Text>
                </Box>

                {/* English Translation */}
                <Box pl={2} borderLeft="2px solid" borderColor="green.500">
                  <Text fontSize="xs" color="gray.300" lineHeight="1.6">
                    {ayah.translation_en}
                  </Text>
                </Box>
              </Box>
            ))}

            {results.length === 0 && !loading && (
              <VStack py={8} spacing={2} textAlign="center">
                <Text fontSize="2xl">📖</Text>
                <Text fontSize="sm" color="gray.400">
                  No ayahs found. Try typing a reference like <code>2:255</code> or a topic word.
                </Text>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QuranLookupModal;
