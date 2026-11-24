import React, { useState, useMemo } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Button,
  Tooltip,
  useColorModeValue,
  useToast,
  Divider,
} from '@chakra-ui/react';
import {
  FiMessageSquare,
  FiSearch,
  FiCopy,
  FiTrash2,
  FiEdit3,
  FiExternalLink,
  FiCheck,
  FiFilter,
} from 'react-icons/fi';
import type { PdfComment, PdfCommentColor } from '../../../shared/types';

interface PdfCommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: PdfComment[];
  onSelectComment: (comment: PdfComment) => void;
  onDeleteComment: (id: string) => void;
  onEnterCommentMode: () => void;
}

const COLOR_NAMES: Record<PdfCommentColor, { label: string; hex: string; bg: string }> = {
  amber: { label: 'Amber', hex: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  emerald: { label: 'Emerald', hex: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  sky: { label: 'Sky', hex: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  rose: { label: 'Rose', hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
  violet: { label: 'Violet', hex: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

export const PdfCommentsDrawer: React.FC<PdfCommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  onSelectComment,
  onDeleteComment,
  onEnterCommentMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<PdfCommentColor | 'all'>('all');
  const toast = useToast();

  const isDark = useColorModeValue(false, true);
  const cardBg = useColorModeValue('#ffffff', '#181b20');
  const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const hoverBg = useColorModeValue('gray.50', '#1f242c');
  const headerBg = useColorModeValue('#f7f7f7', '#141414');
  const drawerBg = useColorModeValue('gray.50', '#0e1117');

  // Filter comments
  const filteredComments = useMemo(() => {
    let result = [...comments];

    if (selectedColor !== 'all') {
      result = result.filter((c) => c.color === selectedColor);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          String(c.page).includes(q)
      );
    }

    return result.sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [comments, selectedColor, searchQuery]);

  // Group by page
  const groupedByPage = useMemo(() => {
    const map = new Map<number, PdfComment[]>();
    for (const c of filteredComments) {
      const list = map.get(c.page) || [];
      list.push(c);
      map.set(c.page, list);
    }
    return Array.from(map.entries()).sort(([pA], [pB]) => pA - pB);
  }, [filteredComments]);

  // Copy all comments as formatted Markdown
  const handleCopyAll = () => {
    if (comments.length === 0) return;

    let md = `# Textbook Notes & Annotations\n\n`;
    const sorted = [...comments].sort((a, b) => a.page - b.page);
    let currentPage = -1;

    for (const c of sorted) {
      if (c.page !== currentPage) {
        currentPage = c.page;
        md += `\n### Page ${currentPage}\n`;
      }
      if (c.content) {
        md += `- ${c.content}\n`;
      } else if (c.drawingData) {
        md += `- [Hand-drawn ink annotation]\n`;
      }
    }

    navigator.clipboard.writeText(md);
    toast({
      title: 'Notes copied to clipboard!',
      description: `Exported ${comments.length} textbook notes formatted as Markdown.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader
          bg={headerBg}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          py={3}
          px={4}
        >
          <HStack justify="space-between" pr={6}>
            <HStack spacing={2}>
              <FiMessageSquare color="#10b981" />
              <Text fontSize="sm" fontWeight="bold">
                Textbook Notes
              </Text>
              <Badge colorScheme="green" borderRadius="full" px={2} fontSize="2xs">
                {comments.length}
              </Badge>
            </HStack>
            {comments.length > 0 && (
              <Tooltip label="Copy all notes as Markdown">
                <IconButton
                  aria-label="Copy all notes"
                  icon={<FiCopy size={13} />}
                  size="xs"
                  variant="ghost"
                  onClick={handleCopyAll}
                />
              </Tooltip>
            )}
          </HStack>
        </DrawerHeader>

        <DrawerBody p={3}>
          <VStack spacing={3} align="stretch">
            {/* Search Bar */}
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search notes or page number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="md"
                variant="filled"
                fontSize="xs"
              />
            </InputGroup>

            {/* Color Filter Pills */}
            <HStack spacing={1} overflowX="auto" py={0.5}>
              <Button
                size="2xs"
                variant={selectedColor === 'all' ? 'solid' : 'ghost'}
                colorScheme="gray"
                onClick={() => setSelectedColor('all')}
                borderRadius="full"
              >
                All
              </Button>
              {(Object.keys(COLOR_NAMES) as PdfCommentColor[]).map((col) => (
                <Button
                  key={col}
                  size="2xs"
                  variant={selectedColor === col ? 'solid' : 'ghost'}
                  borderRadius="full"
                  px={2}
                  onClick={() => setSelectedColor(col)}
                  leftIcon={
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={COLOR_NAMES[col].hex}
                    />
                  }
                >
                  {COLOR_NAMES[col].label}
                </Button>
              ))}
            </HStack>

            {/* Comments List */}
            {groupedByPage.length === 0 ? (
              <Box
                py={12}
                px={4}
                textAlign="center"
                borderRadius="md"
                bg={cardBg}
                border="1px dashed"
                borderColor={cardBorder}
              >
                <FiEdit3
                  size={28}
                  style={{ margin: '0 auto 12px auto', opacity: 0.4 }}
                />
                <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                  {comments.length === 0 ? 'No notes on this textbook yet' : 'No notes match your search'}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1} maxW="240px" mx="auto">
                  {comments.length === 0
                    ? 'Click "Comment Mode" in the toolbar, then click anywhere on any page to add sticky reflections.'
                    : 'Try searching with a different word or clearing the color filter.'}
                </Text>
                {comments.length === 0 && (
                  <Button
                    size="xs"
                    colorScheme="green"
                    mt={4}
                    leftIcon={<FiEdit3 />}
                    onClick={() => {
                      onClose();
                      onEnterCommentMode();
                    }}
                  >
                    Start Adding Notes
                  </Button>
                )}
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {groupedByPage.map(([page, pageComments]) => (
                  <Box key={page}>
                    {/* Page Section Header */}
                    <HStack mb={1.5} spacing={2}>
                      <Badge colorScheme="purple" fontSize="2xs" px={2} py={0.5} borderRadius="md">
                        📄 Page {page}
                      </Badge>
                      <Text fontSize="2xs" color="gray.500">
                        ({pageComments.length} {pageComments.length === 1 ? 'note' : 'notes'})
                      </Text>
                    </HStack>

                    {/* Page Comments */}
                    <VStack spacing={2} align="stretch">
                      {pageComments.map((c) => {
                        const cMeta = COLOR_NAMES[c.color] || COLOR_NAMES.amber;
                        return (
                          <Box
                            key={c.id}
                            p={2.5}
                            borderRadius="md"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderLeft="3px solid"
                            borderLeftColor={cMeta.hex}
                            cursor="pointer"
                            transition="all 0.15s ease"
                            _hover={{
                              bg: hoverBg,
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                            onClick={() => {
                              onSelectComment(c);
                              onClose();
                            }}
                          >
                            <HStack justify="space-between" mb={1}>
                              <HStack spacing={1.5}>
                                <Box
                                  w="8px"
                                  h="8px"
                                  borderRadius="full"
                                  bg={cMeta.hex}
                                />
                                <Text fontSize="3xs" color="gray.400" fontWeight="medium">
                                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </Text>
                                {c.drawingData && (
                                  <Badge colorScheme="blue" fontSize="3xs" px={1}>
                                    Ink
                                  </Badge>
                                )}
                              </HStack>

                              <HStack spacing={1}>
                                <Tooltip label="Delete note">
                                  <IconButton
                                    aria-label="Delete note"
                                    icon={<FiTrash2 size={11} />}
                                    size="2xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteComment(c.id);
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label="Jump to note">
                                  <IconButton
                                    aria-label="Jump to note"
                                    icon={<FiExternalLink size={11} />}
                                    size="2xs"
                                    variant="ghost"
                                    colorScheme="green"
                                  />
                                </Tooltip>
                              </HStack>
                            </HStack>

                            {/* Content Preview */}
                            {c.content ? (
                              <Text
                                fontSize={c.fontStyle === 'handwriting' ? '15px' : 'xs'}
                                fontFamily={
                                  c.fontStyle === 'handwriting'
                                    ? "'Caveat', 'Segoe Print', 'Bradley Hand', 'Amiri', cursive, serif"
                                    : 'inherit'
                                }
                                fontWeight={c.fontStyle === 'handwriting' ? 600 : 400}
                                color={isDark ? 'gray.200' : 'gray.800'}
                                noOfLines={3}
                                lineHeight="1.3"
                              >
                                {c.content}
                              </Text>
                            ) : c.drawingData ? (
                              <Box mt={1} p={1} bg={isDark ? 'blackAlpha.400' : 'gray.100'} borderRadius="sm">
                                <img
                                  src={c.drawingData}
                                  alt="Handwritten sketch"
                                  style={{ maxHeight: '40px', objectFit: 'contain' }}
                                />
                              </Box>
                            ) : (
                              <Text fontSize="xs" fontStyle="italic" color="gray.500">
                                Empty note
                              </Text>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default PdfCommentsDrawer;
