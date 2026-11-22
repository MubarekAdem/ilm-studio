import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Button,
  Text,
  VStack,
  Divider,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiList,
  FiSave,
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAppStore } from '../../stores/appStore';

interface NoteEditorProps {
  lectureId: string | null;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ lectureId }) => {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const lecturesList = useAppStore((s) => s.lecturesList);
  const lecture = lecturesList.find((l) => l.id === lectureId) ?? null;

  const surfaceBg = useColorModeValue('white', '#16213e');
  const toolbarBg = useColorModeValue('gray.50', '#0f1a2e');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style:
          'outline: none; min-height: 300px; padding: 16px; font-size: 14px; line-height: 1.7;',
      },
    },
  });

  // Load existing note when lectureId changes
  useEffect(() => {
    if (!lectureId || !editor) {
      editor?.commands.clearContent();
      setNoteId(null);
      return;
    }

    let cancelled = false;

    const loadNote = async () => {
      try {
        const notes = await window.api.getNotes(lectureId);
        if (cancelled) return;
        if (notes && notes.length > 0) {
          const note = notes[0];
          setNoteId(note.id);
          try {
            const parsed = JSON.parse(note.content);
            editor.commands.setContent(parsed);
          } catch {
            // If content is plain text, set as paragraph
            editor.commands.setContent(note.content || '');
          }
        } else {
          setNoteId(null);
          editor.commands.clearContent();
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };

    loadNote();
    return () => {
      cancelled = true;
    };
  }, [lectureId, editor]);

  // Save note
  const handleSave = useCallback(async () => {
    if (!lectureId || !editor) return;
    setSaving(true);

    try {
      const content = JSON.stringify(editor.getJSON());

      if (noteId) {
        await window.api.updateNote(noteId, { content });
      } else {
        const created = await window.api.createNote({
          lectureId,
          content,
          audioTimestamp: null,
          pdfPage: null,
        });
        if (created?.id) setNoteId(created.id);
      }

      toast({
        title: 'Note saved',
        status: 'success',
        duration: 1500,
        isClosable: true,
        position: 'bottom-right',
      });
    } catch (err) {
      console.error('Failed to save note:', err);
      toast({
        title: 'Save failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });
    } finally {
      setSaving(false);
    }
  }, [lectureId, editor, noteId, toast]);

  if (!lectureId) {
    return (
      <VStack h="100%" align="center" justify="center" p={8} spacing={3}>
        <Text color="gray.500" fontSize="lg">
          📝
        </Text>
        <Text color="gray.500" textAlign="center">
          Select a lecture to start taking notes
        </Text>
      </VStack>
    );
  }

  return (
    <VStack h="100%" spacing={0} align="stretch">
      {/* Header */}
      <HStack px={4} py={3} justify="space-between" flexShrink={0}>
        <Box>
          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
            {lecture?.title ?? 'Lecture Notes'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Notes
          </Text>
        </Box>
        <Button
          size="sm"
          colorScheme="green"
          leftIcon={<FiSave />}
          onClick={handleSave}
          isLoading={saving}
        >
          Save
        </Button>
      </HStack>

      <Divider borderColor={borderColor} />

      {/* Toolbar */}
      <HStack
        px={3}
        py={1.5}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        spacing={1}
        flexShrink={0}
      >
        <Tooltip label="Bold (Ctrl+B)">
          <IconButton
            aria-label="Bold"
            icon={<FiBold />}
            size="sm"
            variant={editor?.isActive('bold') ? 'solid' : 'ghost'}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
        </Tooltip>

        <Tooltip label="Italic (Ctrl+I)">
          <IconButton
            aria-label="Italic"
            icon={<FiItalic />}
            size="sm"
            variant={editor?.isActive('italic') ? 'solid' : 'ghost'}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
        </Tooltip>

        <Tooltip label="Heading">
          <IconButton
            aria-label="Heading"
            icon={<Text fontSize="sm" fontWeight="bold">H</Text>}
            size="sm"
            variant={editor?.isActive('heading') ? 'solid' : 'ghost'}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
        </Tooltip>

        <Box w="1px" h="20px" bg={borderColor} mx={1} />

        <Tooltip label="Bullet List">
          <IconButton
            aria-label="Bullet List"
            icon={<FiList />}
            size="sm"
            variant={editor?.isActive('bulletList') ? 'solid' : 'ghost'}
            onClick={() =>
              editor?.chain().focus().toggleBulletList().run()
            }
          />
        </Tooltip>

        <Tooltip label="Ordered List">
          <IconButton
            aria-label="Ordered List"
            icon={<Text fontSize="sm" fontWeight="bold">1.</Text>}
            size="sm"
            variant={editor?.isActive('orderedList') ? 'solid' : 'ghost'}
            onClick={() =>
              editor?.chain().focus().toggleOrderedList().run()
            }
          />
        </Tooltip>
      </HStack>

      {/* Editor content */}
      <Box
        flex={1}
        overflow="auto"
        bg={surfaceBg}
        css={{
          '.tiptap-editor': {
            minHeight: '100%',
          },
          '.tiptap-editor p.is-editor-empty:first-child::before': {
            content: '"Start taking notes..."',
            color: 'var(--chakra-colors-gray-500)',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </VStack>
  );
};

export default NoteEditor;
