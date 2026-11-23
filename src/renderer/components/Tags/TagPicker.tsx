import React, { useState, useEffect, useCallback } from 'react';
import {
  HStack,
  Button,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  Input,
  Text,
  Box,
  IconButton,
  Icon,
  useColorModeValue,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { FiTag, FiPlus, FiX, FiSettings } from 'react-icons/fi';
import type { Tag } from '../../../shared/types';
import { useAppStore } from '../../stores/appStore';

interface TagPickerProps {
  noteId: string | null;
}

const CATEGORY_COLORS: Record<Tag['category'], string> = {
  topic: 'green',
  scholar: 'blue',
  book: 'yellow',
  custom: 'purple',
};

export const TagPicker: React.FC<TagPickerProps> = ({ noteId }) => {
  const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const setTagManagerOpen = useAppStore((s) => s.setTagManagerOpen);

  const popoverBg = useColorModeValue('#ffffff', '#1f1f1f');
  const hoverBg = useColorModeValue('#eeeeee', 'whiteAlpha.100');
  const inputBg = useColorModeValue('#f7f7f7', 'rgba(255, 255, 255, 0.04)');

  const loadData = useCallback(async () => {
    try {
      const [all, assigned] = await Promise.all([
        window.api.getAllTags(),
        noteId ? window.api.getNoteTags(noteId) : Promise.resolve([]),
      ]);
      setAllTags(all);
      setAssignedTags(assigned);
    } catch (err) {
      console.error('Failed to load note tags:', err);
    }
  }, [noteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTag = async (tag: Tag) => {
    if (!noteId) return;
    try {
      await window.api.addNoteTag(noteId, tag.id);
      setAssignedTags((prev) => [...prev, tag]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!noteId) return;
    try {
      await window.api.removeNoteTag(noteId, tagId);
      setAssignedTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error(err);
    }
  };

  const unassigned = allTags.filter(
    (t) => !assignedTags.some((at) => at.id === t.id) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <HStack spacing={1.5} wrap="wrap" align="center">
      {/* Existing assigned tag badges */}
      {assignedTags.map((tag) => (
        <Badge
          key={tag.id}
          colorScheme={CATEGORY_COLORS[tag.category] || 'gray'}
          fontSize="2xs"
          px={2}
          py={0.5}
          borderRadius="full"
          display="inline-flex"
          alignItems="center"
          gap={1}
        >
          <Text as="span">{tag.name}</Text>
          <Icon
            as={FiX}
            boxSize={2.5}
            cursor="pointer"
            _hover={{ color: 'red.400' }}
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag.id);
            }}
          />
        </Badge>
      ))}

      {/* Popover to add more tags */}
      {noteId && (
        <Popover placement="bottom-start">
          <PopoverTrigger>
            <Button
              size="2xs"
              variant="outline"
              colorScheme="gray"
              leftIcon={<FiPlus />}
              borderRadius="full"
            >
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent w="240px" bg={popoverBg} boxShadow="lg">
            <PopoverArrow />
            <PopoverCloseButton size="xs" />
            <PopoverHeader fontSize="xs" fontWeight="bold">
              Add Tag to Note
            </PopoverHeader>
            <PopoverBody p={2}>
              <VStack spacing={2} align="stretch">
                <Input
                  size="xs"
                  placeholder="Search tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg={inputBg}
                />

                <Box maxH="140px" overflowY="auto">
                  {unassigned.length === 0 ? (
                    <Text fontSize="2xs" color="gray.500" textAlign="center" py={2}>
                      {allTags.length === 0 ? 'No tags created yet.' : 'All matching tags added.'}
                    </Text>
                  ) : (
                    <VStack spacing={1} align="stretch">
                      {unassigned.map((tag) => (
                        <HStack
                          key={tag.id}
                          px={2}
                          py={1}
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          justify="space-between"
                          onClick={() => handleAddTag(tag)}
                        >
                          <Text fontSize="xs" noOfLines={1}>
                            {tag.name}
                          </Text>
                          <Badge
                            colorScheme={CATEGORY_COLORS[tag.category] || 'gray'}
                            fontSize="3xs"
                            borderRadius="full"
                          >
                            {tag.category}
                          </Badge>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>

                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<FiSettings />}
                  onClick={() => setTagManagerOpen(true)}
                  justifyContent="flex-start"
                >
                  Manage all tags...
                </Button>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </HStack>
  );
};

export default TagPicker;
