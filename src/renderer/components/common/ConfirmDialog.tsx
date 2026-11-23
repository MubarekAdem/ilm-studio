import React, { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColorScheme?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmColorScheme = 'red',
  isLoading = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const modalBg = useColorModeValue('white', '#16213e');

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
      size="md"
    >
      <AlertDialogOverlay bg="blackAlpha.700">
        <AlertDialogContent bg={modalBg}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
            {message}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} size="sm" variant="ghost">
              {cancelText}
            </Button>
            <Button
              colorScheme={confirmColorScheme}
              onClick={onConfirm}
              ml={3}
              size="sm"
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmDialog;
