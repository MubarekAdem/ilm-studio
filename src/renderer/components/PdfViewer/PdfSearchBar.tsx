import React, { useState, useEffect } from 'react';
import {
  HStack,
  Input,
  IconButton,
  Text,
  Badge,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { FiSearch, FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist';

interface MatchResult {
  pageNumber: number;
  count: number;
}

interface PdfSearchBarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  isOpen: boolean;
  onClose: () => void;
  onJumpToPage: (page: number) => void;
}

export const PdfSearchBar: React.FC<PdfSearchBarProps> = ({
  pdfDoc,
  isOpen,
  onClose,
  onJumpToPage,
}) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  const barBg = useColorModeValue('white', '#16213e');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMatches([]);
      setCurrentMatchIdx(0);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!pdfDoc || !query.trim()) {
      setMatches([]);
      return;
    }

    setSearching(true);
    const results: MatchResult[] = [];
    const q = query.trim().toLowerCase();

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const fullPageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .toLowerCase();

        // Count occurrences
        let count = 0;
        let pos = fullPageText.indexOf(q);
        while (pos !== -1) {
          count++;
          pos = fullPageText.indexOf(q, pos + q.length);
        }

        if (count > 0) {
          results.push({ pageNumber: i, count });
        }
      }

      setMatches(results);
      if (results.length > 0) {
        setCurrentMatchIdx(0);
        onJumpToPage(results[0].pageNumber);
      }
    } catch (err) {
      console.error('PDF search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    onJumpToPage(matches[nextIdx].pageNumber);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    onJumpToPage(matches[prevIdx].pageNumber);
  };

  if (!isOpen) return null;

  const totalMatchesCount = matches.reduce((acc, m) => acc + m.count, 0);

  return (
    <HStack
      px={3}
      py={2}
      bg={barBg}
      borderBottom="1px solid"
      borderColor={borderColor}
      spacing={2}
      justify="space-between"
      boxShadow="sm"
    >
      <HStack spacing={2} flex={1}>
        <Input
          size="xs"
          placeholder="Search in PDF textbook (Arabic / English)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          bg={inputBg}
          maxW="280px"
          autoFocus
        />
        <IconButton
          aria-label="Search"
          icon={searching ? <Spinner size="xs" /> : <FiSearch />}
          size="xs"
          colorScheme="green"
          onClick={handleSearch}
          isLoading={searching}
        />
        {matches.length > 0 && (
          <Badge fontSize="2xs" colorScheme="green">
            Page {matches[currentMatchIdx].pageNumber} ({currentMatchIdx + 1} of {matches.length} pages, {totalMatchesCount} matches)
          </Badge>
        )}
        {query && !searching && matches.length === 0 && (
          <Text fontSize="2xs" color="gray.400">
            No matches found
          </Text>
        )}
      </HStack>

      <HStack spacing={1}>
        <IconButton
          aria-label="Previous match"
          icon={<FiChevronUp />}
          size="xs"
          variant="ghost"
          isDisabled={matches.length <= 1}
          onClick={handlePrev}
        />
        <IconButton
          aria-label="Next match"
          icon={<FiChevronDown />}
          size="xs"
          variant="ghost"
          isDisabled={matches.length <= 1}
          onClick={handleNext}
        />
        <IconButton
          aria-label="Close search"
          icon={<FiX />}
          size="xs"
          variant="ghost"
          onClick={onClose}
        />
      </HStack>
    </HStack>
  );
};

export default PdfSearchBar;
