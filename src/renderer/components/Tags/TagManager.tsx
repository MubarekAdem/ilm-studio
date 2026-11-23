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
  VStack,
  HStack,
  Input,
  Select,
  Text,
  Badge,
  IconButton,
  Icon,
  Box,
  SimpleGrid,
  useToast,
  useColorModeValue,
  Tag as ChakraTag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { FiTag, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { Tag } from '../../../shared/types';
import ConfirmDialog from '../common/ConfirmDialog';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated?: () => void;
}

const CATEGORY_COLORS: Record<Tag['category'], string> = {
  topic: 'green',
  scholar: 'blue',
  book: 'yellow',
  custom: 'purple',
};

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, onTagsUpdated }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<Tag['category']>('topic');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const modalBg = useColorModeValue('#ffffff', '#181818');
  const inputBg = useColorModeValue('#f7f7f7', 'rgba(255, 255, 255, 0.04)');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');

  const loadTags = async () => {
    try {
      const allTags = await window.api.getAllTags();
      setTags(allTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);

    try {
      await window.api.createTag({
        name: newTagName.trim(),
        category: newTagCategory,
      });

      toast({
        title: 'Tag created',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });

      setNewTagName('');
      await loadTags();
      onTagsUpdated?.();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Failed to create tag',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await window.api.deleteTag(tagToDelete.id);
      toast({
        title: `Deleted tag "${tagToDelete.name}"`,
        status: 'info',
        duration: 1500,
        isClosable: true,
      });
      setTagToDelete(null);
      await loadTags();
      onTagsUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTags = selectedFilter === 'all'
    ? tags
    : tags.filter((t) => t.category === selectedFilter);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg={modalBg}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FiTag} color="green.400" />
              <Text>Manage Tags & Topics</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Create tag row */}
              <Box p={3} border="1px solid" borderColor={borderColor} borderRadius="lg">
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.400" mb={2}>
                  Create New Tag
                </Text>
                <HStack spacing={2}>
                  <Input
                    placeholder="Tag name (e.g., Fiqh of Salah)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    size="sm"
                    bg={inputBg}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTag();
                    }}
                  />
                  <Select
                    size="sm"
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value as any)}
                    maxW="130px"
                    bg={inputBg}
                  >
                    <option value="topic">Topic</option>
                    <option value="scholar">Scholar</option>
                    <option value="book">Book</option>
                    <option value="custom">Custom</option>
                  </Select>
                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<FiPlus />}
                    onClick={handleCreateTag}
                    isLoading={creating}
                  >
                    Add
                  </Button>
                </HStack>
              </Box>

              {/* Filter tags by category */}
              <HStack justify="space-between" align="center">
                <Text fontSize="xs" color="gray.400">
                  {filteredTags.length} {filteredTags.length === 1 ? 'tag' : 'tags'}
                </Text>
                <Select
                  size="xs"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  maxW="140px"
                >
                  <option value="all">All Categories</option>
                  <option value="topic">Topic</option>
                  <option value="scholar">Scholar</option>
                  <option value="book">Book</option>
                  <option value="custom">Custom</option>
                </Select>
              </HStack>

              {/* Tag list */}
              <Box
                maxH="280px"
                overflowY="auto"
                p={2}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
              >
                {filteredTags.length === 0 ? (
                  <Text fontSize="xs" color="gray.500" textAlign="center" py={6}>
                    No tags found in this category.
                  </Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                    {filteredTags.map((tag) => (
                      <HStack
                        key={tag.id}
                        p={2}
                        borderRadius="md"
                        bg={inputBg}
                        justify="space-between"
                        spacing={2}
                      >
                        <HStack spacing={1.5} flex={1} minW={0}>
                          <Badge
                            colorScheme={CATEGORY_COLORS[tag.category] || 'gray'}
                            fontSize="2xs"
                            px={1.5}
                            borderRadius="full"
                          >
                            {tag.category}
                          </Badge>
                          <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                            {tag.name}
                          </Text>
                        </HStack>
                        <IconButton
                          aria-label="Delete tag"
                          icon={<FiTrash2 />}
                          size="2xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setTagToDelete(tag)}
                        />
                      </HStack>
                    ))}
                  </SimpleGrid>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(tagToDelete)}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? It will be removed from all associated notes.`}
        confirmText="Delete Tag"
      />
    </>
  );
};

export default TagManager;
