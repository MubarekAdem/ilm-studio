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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  HStack,
  Icon,
  Text,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFolderPlus, FiEdit2 } from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';
import type { Series } from '../../../shared/types';

interface CreateSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  series?: Series | null;
}

export const CreateSeriesModal: React.FC<CreateSeriesModalProps> = ({ isOpen, onClose, series }) => {
  const [title, setTitle] = useState('');
  const [scholar, setScholar] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSeries = useAppStore((s) => s.loadSeries);
  const toast = useToast();

  const modalBg = useColorModeValue('white', '#16213e');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const isEdit = Boolean(series);

  useEffect(() => {
    if (series) {
      setTitle(series.title || '');
      setScholar(series.scholar || '');
      setTopic(series.topic || '');
      setDescription(series.description || '');
    } else {
      setTitle('');
      setScholar('');
      setTopic('');
      setDescription('');
    }
  }, [series, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && series) {
        await window.api.updateSeries(series.id, {
          title: title.trim(),
          scholar: scholar.trim(),
          topic: topic.trim(),
          description: description.trim(),
        });
        toast({
          title: 'Series updated',
          status: 'success',
          duration: 2500,
          isClosable: true,
        });
      } else {
        await window.api.createSeries({
          title: title.trim(),
          scholar: scholar.trim(),
          topic: topic.trim(),
          description: description.trim(),
          totalLectures: 0,
        });
        toast({
          title: 'Series created',
          status: 'success',
          duration: 2500,
          isClosable: true,
        });
      }

      await loadSeries();
      resetAndClose();
    } catch (error) {
      console.error('Failed to save series:', error);
      toast({
        title: isEdit ? 'Error updating series' : 'Error creating series',
        description: String(error),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setScholar('');
    setTopic('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg}>
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={isEdit ? FiEdit2 : FiFolderPlus} color="green.400" />
            <Text>{isEdit ? 'Edit Lecture Series' : 'New Lecture Series'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="sm">Series Title</FormLabel>
              <Input
                placeholder="e.g., Sharh Bulugh al-Maram"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                bg={inputBg}
                size="sm"
                autoFocus
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Scholar / Teacher</FormLabel>
              <Input
                placeholder="e.g., Sheikh Ibn Uthaymeen"
                value={scholar}
                onChange={(e) => setScholar(e.target.value)}
                bg={inputBg}
                size="sm"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Topic / Field</FormLabel>
              <Input
                placeholder="e.g., Fiqh, Aqeedah, Hadith, Tafseer"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                bg={inputBg}
                size="sm"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Description (optional)</FormLabel>
              <Textarea
                placeholder="Brief notes about the course or reference textbook..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                bg={inputBg}
                size="sm"
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={resetAndClose} size="sm">
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={saving}
            size="sm"
          >
            {isEdit ? 'Save Changes' : 'Create Series'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
