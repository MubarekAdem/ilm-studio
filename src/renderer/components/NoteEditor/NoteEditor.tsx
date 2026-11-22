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
  Badge,
} from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiList,
  FiSave,
  FiClock,
  FiFileText,
  FiAlignRight,
  FiAlignLeft,
  FiBookOpen,
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import { QuranLookupModal } from '../Quran/QuranLookupModal';
import type { Ayah } from '../../../shared/types';

interface NoteEditorProps {
  lectureId: string | null;
}

/** Format seconds to mm:ss */
function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ lectureId }) => {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const toast = useToast();

  const lecturesList = useAppStore((s) => s.lecturesList);
  const currentPdfPage = useAppStore((s) => s.currentPdfPage);
  const jumpToPdfPage = useAppStore((s) => s.jumpToPdfPage);

  const currentTime = usePlayerStore((s) => s.currentTime);
  const seek = usePlayerStore((s) => s.seek);
  const play = usePlayerStore((s) => s.play);

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
          'outline: none; min-height: 350px; padding: 16px; font-size: 15px; line-height: 1.8;',
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
          audioTimestamp: Math.round(currentTime),
          pdfPage: currentPdfPage,
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
  }, [lectureId, editor, noteId, currentTime, currentPdfPage, toast]);

  // Insert current audio timestamp chip
  const handleInsertTimestamp = () => {
    if (!editor) return;
    const timeFormatted = formatTime(currentTime);
    const html = `<button class="timestamp-chip" data-timestamp="${currentTime.toFixed(1)}" style="background: rgba(45, 106, 79, 0.3); border: 1px solid #4db37f; color: #6dc295; padding: 2px 7px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; user-select: none; margin: 0 4px; display: inline-flex; align-items: center; gap: 3px;">⏱️ ${timeFormatted}</button>&nbsp;`;
    editor.chain().focus().insertContent(html).run();
  };

  // Insert current PDF page chip
  const handleInsertPage = () => {
    if (!editor) return;
    const html = `<button class="page-chip" data-page="${currentPdfPage}" style="background: rgba(212, 168, 67, 0.3); border: 1px solid #d4a843; color: #e6c85c; padding: 2px 7px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; user-select: none; margin: 0 4px; display: inline-flex; align-items: center; gap: 3px;">📄 p. ${currentPdfPage}</button>&nbsp;`;
    editor.chain().focus().insertContent(html).run();
  };

  // Insert formatted Quran Ayah quote block
  const handleInsertAyah = (ayah: Ayah) => {
    if (!editor) return;
    const ayahHtml = `
      <blockquote class="quran-quote" style="border-right: 4px solid #2d6a4f; background: rgba(45, 106, 79, 0.15); padding: 12px 16px; margin: 12px 0; border-radius: 6px;" dir="rtl">
        <p style="font-family: 'Amiri', serif; font-size: 20px; color: #4db37f; margin: 0 0 8px 0; line-height: 2.1; font-weight: 500;">${ayah.text_uthmani}</p>
        <p dir="ltr" style="font-size: 13.5px; color: #cbd5e1; margin: 0; font-style: italic; line-height: 1.6;">"${ayah.translation_en}"</p>
        <p dir="ltr" style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0; font-weight: 600;">— Surah ${ayah.surah_name_simple || ''} [${ayah.verse_key}]</p>
      </blockquote>
      <p></p>
    `;
    editor.chain().focus().insertContent(ayahHtml).run();
  };

  // Handle click on timestamp or page chips
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('[data-timestamp], [data-page]');
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    const timestampAttr = target.getAttribute('data-timestamp');
    if (timestampAttr) {
      const ts = parseFloat(timestampAttr);
      seek(ts);
      play();
      toast({
        title: `Jumped to ${formatTime(ts)}`,
        status: 'info',
        duration: 1000,
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    const pageAttr = target.getAttribute('data-page');
    if (pageAttr) {
      const pageNum = parseInt(pageAttr, 10);
      jumpToPdfPage(pageNum);
      toast({
        title: `Jumped to PDF page ${pageNum}`,
        status: 'info',
        duration: 1000,
        isClosable: true,
        position: 'bottom',
      });
    }
  };

  if (!lectureId) {
    return (
      <VStack h="100%" align="center" justify="center" p={8} spacing={3}>
        <Text color="gray.500" fontSize="3xl">
          📝
        </Text>
        <Text color="gray.400" fontSize="sm" textAlign="center">
          Select a lecture from the sidebar to view or write study notes.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack h="100%" spacing={0} align="stretch">
      {/* Header */}
      <HStack px={4} py={3} justify="space-between" flexShrink={0} bg={surfaceBg}>
        <Box flex={1} minW={0} mr={2}>
          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
            {lecture?.title ?? 'Lecture Notes'}
          </Text>
          <HStack spacing={2} mt={0.5}>
            <Badge colorScheme="green" fontSize="2xs" borderRadius="md">
              Notes
            </Badge>
            <Text fontSize="2xs" color="gray.400">
              Synced with audio & PDF
            </Text>
          </HStack>
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

      {/* Formatting & Sync Toolbar */}
      <HStack
        px={3}
        py={1.5}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        spacing={1}
        flexShrink={0}
        wrap="wrap"
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

        <Box w="1px" h="18px" bg={borderColor} mx={1} />

        {/* Sync insertion tools */}
        <Tooltip label="Insert Clickable Timestamp at current audio position">
          <Button
            size="xs"
            colorScheme="green"
            variant="outline"
            leftIcon={<FiClock />}
            onClick={handleInsertTimestamp}
          >
            {formatTime(currentTime)}
          </Button>
        </Tooltip>

        <Tooltip label={`Insert Clickable Link to PDF Page ${currentPdfPage}`}>
          <Button
            size="xs"
            colorScheme="yellow"
            variant="outline"
            leftIcon={<FiFileText />}
            onClick={handleInsertPage}
          >
            Page {currentPdfPage}
          </Button>
        </Tooltip>

        <Tooltip label="Lookup & Insert Quran Ayah (Uthmani + Translation)">
          <Button
            size="xs"
            colorScheme="teal"
            variant="outline"
            leftIcon={<FiBookOpen />}
            onClick={() => setIsQuranOpen(true)}
          >
            📖 Quran
          </Button>
        </Tooltip>

        <Box w="1px" h="18px" bg={borderColor} mx={1} />

        {/* RTL / LTR Toggle */}
        <Tooltip label={isRTL ? 'Switch to Left-to-Right (English)' : 'Switch to Right-to-Left (Arabic)'}>
          <IconButton
            aria-label="Toggle text direction"
            icon={isRTL ? <FiAlignLeft /> : <FiAlignRight />}
            size="sm"
            variant="ghost"
            onClick={() => setIsRTL((v) => !v)}
          />
        </Tooltip>
      </HStack>

      {/* Editor Content Area */}
      <Box
        flex={1}
        overflow="auto"
        bg={surfaceBg}
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={handleEditorClick}
        css={{
          '.tiptap-editor': {
            minHeight: '100%',
            fontFamily: isRTL ? "'Amiri', serif" : 'inherit',
          },
          '.tiptap-editor p.is-editor-empty:first-child::before': {
            content: '"Type lecture notes here... Click timestamp/page buttons to link moments in audio and text."',
            color: 'var(--chakra-colors-gray-500)',
            float: isRTL ? 'right' : 'left',
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

      {/* Quran Verse Lookup Modal */}
      <QuranLookupModal
        isOpen={isQuranOpen}
        onClose={() => setIsQuranOpen(false)}
        onInsertAyah={handleInsertAyah}
      />
    </VStack>
  );
};

export default NoteEditor;
