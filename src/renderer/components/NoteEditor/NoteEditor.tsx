import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  FiDownload,
  FiMaximize2,
  FiMinimize2,
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAppStore } from '../../stores/appStore';
import { usePlayerStore } from '../../stores/playerStore';
import { QuranLookupModal } from '../Quran/QuranLookupModal';
import { TagPicker } from '../Tags/TagPicker';
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isRTL, setIsRTL] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const lecturesList = useAppStore((s) => s.lecturesList);
  const currentPdfPage = useAppStore((s) => s.currentPdfPage);
  const jumpToPdfPage = useAppStore((s) => s.jumpToPdfPage);
  const quotedPdfText = useAppStore((s) => s.quotedPdfText);
  const setQuotedPdfText = useAppStore((s) => s.setQuotedPdfText);
  const isFocusMode = useAppStore((s) => s.isFocusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);

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
    onUpdate: () => {
      setSaveStatus('dirty');
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(false);
      }, 2000);
    },
  });

  // Insert quoted matn text from PDF selection
  useEffect(() => {
    if (!quotedPdfText || !editor) return;

    const { text, page } = quotedPdfText;
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const quoteHtml = `
      <blockquote class="matn-quote" style="border-${isArabic ? 'right' : 'left'}: 4px solid #d4a843; background: rgba(212, 168, 67, 0.12); padding: 10px 14px; margin: 10px 0; border-radius: 4px;" ${isArabic ? 'dir="rtl"' : ''}>
        <p style="font-size: ${isArabic ? '18px' : '14px'}; font-family: ${isArabic ? "'Amiri', serif" : 'inherit'}; font-weight: 500; margin: 0 0 6px 0; line-height: 1.9;">${text}</p>
        <p dir="ltr" style="font-size: 11px; color: #d4a843; margin: 0; font-weight: 600;">— Matn / Textbook (p. ${page})</p>
      </blockquote>
      <p></p>
    `;

    editor.chain().focus().insertContent(quoteHtml).run();
    setQuotedPdfText(null);
  }, [quotedPdfText, editor, setQuotedPdfText]);
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
  const handleSave = useCallback(async (isManual = true) => {
    if (!lectureId || !editor) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setSaving(true);
    setSaveStatus('saving');

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

      setSaveStatus('saved');
      if (isManual) {
        toast({
          title: 'Note saved',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'bottom-right',
        });
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      setSaveStatus('dirty');
      if (isManual) {
        toast({
          title: 'Save failed',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right',
        });
      }
    } finally {
      setSaving(false);
    }
  }, [lectureId, editor, noteId, currentTime, currentPdfPage, toast]);

  // Listen for Ctrl+S / Cmd+S to save note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);
  const handleExportMarkdown = () => {
    if (!editor || !lecture) return;
    const json = editor.getJSON();
    let md = `# ${lecture.title}\n\n*Lecture Study Notes — Ilm Studio*\n\n---\n\n`;

    const processNode = (node: any): string => {
      if (!node) return '';
      if (node.type === 'heading') {
        const level = node.attrs?.level || 2;
        const text = node.content?.map(processNode).join('') || '';
        return `${'#'.repeat(level)} ${text}\n\n`;
      }
      if (node.type === 'paragraph') {
        const text = node.content?.map(processNode).join('') || '';
        return `${text}\n\n`;
      }
      if (node.type === 'bulletList') {
        return (
          node.content
            ?.map((item: any) => `- ${item.content?.map(processNode).join('').trim()}`)
            .join('\n') + '\n\n'
        );
      }
      if (node.type === 'blockquote') {
        const text = node.content?.map(processNode).join('').trim() || '';
        return `> ${text.replace(/\n/g, '\n> ')}\n\n`;
      }
      if (node.type === 'text') {
        let text = node.text || '';
        if (node.marks) {
          for (const m of node.marks) {
            if (m.type === 'bold') text = `**${text}**`;
            if (m.type === 'italic') text = `*${text}*`;
          }
        }
        return text;
      }
      if (node.content) {
        return node.content.map(processNode).join('');
      }
      return '';
    };

    if (json.content) {
      md += json.content.map(processNode).join('');
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${lecture.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}_notes.md`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Notes exported to Markdown',
      description: 'Downloaded to your system',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

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
      <VStack h="100%" align="center" justify="center" p={8} spacing={3} position="relative">
        <Box position="absolute" top="12px" right="14px">
          <Tooltip label={isFocusMode ? 'Exit Zen Mode (Show Sidebar)' : 'Zen Focus Mode (Hide Sidebar)'}>
            <Button
              size="sm"
              variant="outline"
              colorScheme={isFocusMode ? 'yellow' : 'gray'}
              leftIcon={isFocusMode ? <FiMinimize2 /> : <FiMaximize2 />}
              onClick={toggleFocusMode}
            >
              {isFocusMode ? 'Exit Zen' : 'Zen Mode'}
            </Button>
          </Tooltip>
        </Box>
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
      <HStack px={4} py={3} justify="space-between" flexShrink={0} bg={surfaceBg} wrap="wrap" gap={2}>
        <Box flex={1} minW="180px">
          <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
            {lecture?.title ?? 'Lecture Notes'}
          </Text>
          <HStack spacing={2} mt={0.5} align="center">
            <Badge
              colorScheme={
                saveStatus === 'saved' ? 'green' : saveStatus === 'saving' ? 'yellow' : 'gray'
              }
              fontSize="2xs"
              borderRadius="md"
            >
              {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </Badge>
            <TagPicker noteId={noteId} />
          </HStack>
        </Box>
        <HStack spacing={2}>
          <Tooltip label={isFocusMode ? 'Exit Zen Mode (Show Sidebar)' : 'Zen Focus Mode (Hide Sidebar)'}>
            <Button
              size="sm"
              variant="outline"
              colorScheme={isFocusMode ? 'yellow' : 'gray'}
              leftIcon={isFocusMode ? <FiMinimize2 /> : <FiMaximize2 />}
              onClick={toggleFocusMode}
            >
              {isFocusMode ? 'Exit Zen' : 'Zen Mode'}
            </Button>
          </Tooltip>
          <Tooltip label="Export Notes to Markdown (.md)">
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              leftIcon={<FiDownload />}
              onClick={handleExportMarkdown}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip label="Save Note (Ctrl+S)">
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<FiSave />}
              onClick={() => handleSave(true)}
              isLoading={saving}
            >
              Save
            </Button>
          </Tooltip>
        </HStack>
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
