import React from 'react';
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
  Icon,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiList, FiBookmark } from 'react-icons/fi';

export interface OutlineItem {
  title: string;
  pageNumber?: number;
  items?: OutlineItem[];
}

interface PdfOutlineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  outline: OutlineItem[];
  onSelectPage: (page: number) => void;
  currentPage: number;
}

const OutlineNode: React.FC<{
  item: OutlineItem;
  level: number;
  onSelectPage: (page: number) => void;
  currentPage: number;
}> = ({ item, level, onSelectPage, currentPage }) => {
  const hoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const activeBg = useColorModeValue('green.50', 'whiteAlpha.200');
  const isCurrent = item.pageNumber === currentPage;

  return (
    <VStack align="stretch" spacing={1} w="100%">
      <HStack
        py={1.5}
        px={2}
        pl={`${level * 16 + 8}px`}
        borderRadius="md"
        cursor="pointer"
        bg={isCurrent ? activeBg : 'transparent'}
        _hover={{ bg: hoverBg }}
        justify="space-between"
        onClick={() => {
          if (item.pageNumber) onSelectPage(item.pageNumber);
        }}
      >
        <HStack spacing={2} flex={1} minW={0}>
          <Icon as={FiBookmark} boxSize={3} color={isCurrent ? 'green.400' : 'gray.400'} />
          <Text
            fontSize="xs"
            fontWeight={isCurrent ? 'bold' : 'normal'}
            color={isCurrent ? 'green.300' : undefined}
            noOfLines={1}
          >
            {item.title}
          </Text>
        </HStack>
        {item.pageNumber && (
          <Badge fontSize="2xs" colorScheme={isCurrent ? 'green' : 'gray'}>
            p. {item.pageNumber}
          </Badge>
        )}
      </HStack>

      {item.items && item.items.length > 0 && (
        <VStack align="stretch" spacing={0.5}>
          {item.items.map((sub, idx) => (
            <OutlineNode
              key={`${sub.title}-${idx}`}
              item={sub}
              level={level + 1}
              onSelectPage={onSelectPage}
              currentPage={currentPage}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export const PdfOutlineDrawer: React.FC<PdfOutlineDrawerProps> = ({
  isOpen,
  onClose,
  outline,
  onSelectPage,
  currentPage,
}) => {
  const drawerBg = useColorModeValue('white', '#16213e');

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader fontSize="sm">
          <HStack spacing={2}>
            <Icon as={FiList} color="green.400" />
            <Text>Table of Contents (Matn Chapters)</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody px={3} py={2} overflowY="auto">
          {outline.length === 0 ? (
            <Box py={8} textAlign="center">
              <Text fontSize="xs" color="gray.500">
                No embedded bookmarks or chapters found in this PDF document.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={1}>
              {outline.map((item, idx) => (
                <OutlineNode
                  key={`${item.title}-${idx}`}
                  item={item}
                  level={0}
                  onSelectPage={(p) => {
                    onSelectPage(p);
                    onClose();
                  }}
                  currentPage={currentPage}
                />
              ))}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default PdfOutlineDrawer;
