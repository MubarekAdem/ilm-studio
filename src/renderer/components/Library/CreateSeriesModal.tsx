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
import { FiFolderPlus } from 'react-icons/fi';
import { useAppStore } from '../../stores/appStore';

interface CreateSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSeriesModal: React.FC<CreateSeriesModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [scholar, setScholar] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSeries = useAppStore((s) => s.loadSeries);
  const toast = useToast();

  const modalBg = useColorModeValue('white', '#16213e');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  const handleCreate = async () => {
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

      await loadSeries();
      resetAndClose();
    } catch (error) {
      console.error('Failed to create series:', error);
      toast({
        title: 'Error creating series',
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
            <Icon as={FiFolderPlus} color="green.400" />
            <Text>New Lecture Series</Text>
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
            onClick={handleCreate}
            isLoading={saving}
            size="sm"
          >
            Create Series
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
