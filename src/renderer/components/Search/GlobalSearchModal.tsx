import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { FiSearch, FiFolder, FiHeadphones, FiFileText } from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { LibrarySearchResult } from '../../../shared/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LibrarySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const selectSeries = useAppStore((s) => s.selectSeries);
  const selectLecture = useAppStore((s) => s.selectLecture);
  const setView = useAppStore((s) => s.setView);
  const lecturesList = useAppStore((s) => s.lecturesList);
  const play = usePlayerStore((s) => s.play);

  const modalBg = useColorModeValue('#ffffff', '#181818');
  const cardBg = useColorModeValue('#f7f7f7', '#222222');
  const hoverBg = useColorModeValue('#eeeeee', 'whiteAlpha.100');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await window.api.searchLibrary(val.trim());
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (res: LibrarySearchResult) => {
    if (res.seriesId) {
      selectSeries(res.seriesId);
    }
    if (res.lectureId) {
      selectLecture(res.lectureId);
      const lec = lecturesList.find((l) => l.id === res.lectureId);
      if (lec?.audioPath) play(lec);
    }
    setView('study');
    onClose();
  };

  const getIcon = (type: LibrarySearchResult['type']) => {
    switch (type) {
      case 'series':
        return FiFolder;
      case 'lecture':
        return FiHeadphones;
      case 'note':
        return FiFileText;
    }
  };

  const getBadgeColor = (type: LibrarySearchResult['type']) => {
    switch (type) {
      case 'series':
        return 'purple';
      case 'lecture':
        return 'green';
      case 'note':
        return 'yellow';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.750" />
      <ModalContent bg={modalBg} maxH="80vh">
        <ModalHeader pb={2}>
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="green.400" />
            </InputLeftElement>
            <Input
              placeholder="Search lectures, course series, notes... (Ctrl+K)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              variant="filled"
              autoFocus
            />
          </InputGroup>
        </ModalHeader>

        <ModalBody pt={2} pb={6}>
          <VStack spacing={2} align="stretch" maxH="50vh" overflowY="auto">
            {results.map((res) => (
              <Box
                key={`${res.type}-${res.id}`}
                p={3}
                borderRadius="md"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                cursor="pointer"
                _hover={{ bg: hoverBg, borderColor: 'green.400' }}
                onClick={() => handleSelectResult(res)}
              >
                <HStack justify="space-between" mb={1}>
                  <HStack spacing={2}>
                    <Icon as={getIcon(res.type)} color="green.400" boxSize={4} />
                    <Text fontSize="sm" fontWeight="bold">
                      {res.title}
                    </Text>
                  </HStack>
                  <Badge colorScheme={getBadgeColor(res.type)} fontSize="2xs" textTransform="uppercase">
                    {res.type}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.400" noOfLines={2}>
                  {res.snippet}
                </Text>
              </Box>
            ))}

            {query.trim() && results.length === 0 && !loading && (
              <Text fontSize="xs" color="gray.500" textAlign="center" py={6}>
                No results found for "{query}".
              </Text>
            )}

            {!query.trim() && (
              <Text fontSize="xs" color="gray.500" textAlign="center" py={4}>
                Type to instantly search across all lectures, series, and notes.
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearchModal;
