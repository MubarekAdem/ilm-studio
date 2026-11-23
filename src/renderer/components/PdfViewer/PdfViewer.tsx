import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  Icon,
  Flex,
  Tooltip,
  useColorModeValue,
  Button,
  useToast,
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiFileText,
  FiSearch,
  FiRotateCw,
  FiMoon,
  FiSun,
  FiList,
  FiCopy,
  FiEdit3,
  FiUpload,
} from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { useAppStore } from '../../stores/appStore';
import { PdfOutlineDrawer, OutlineItem } from './PdfOutlineDrawer';
import { PdfSearchBar } from './PdfSearchBar';
import { toMediaUrl } from '../../utils/mediaUrl';

interface PdfViewerProps {
  pdfPath: string | null;
}

type ColorFilterMode = 'normal' | 'dark' | 'sepia';

const PdfViewerComponent: React.FC<PdfViewerProps> = ({ pdfPath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const lastWheelTimeRef = useRef(0);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [colorFilter, setColorFilter] = useState<ColorFilterMode>('normal');
  const [pageInput, setPageInput] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outline (Table of contents)
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);

  // In-PDF Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Floating text selection toolbar
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const targetPdfPage = useAppStore((s) => s.targetPdfPage);
  const jumpToPdfPage = useAppStore((s) => s.jumpToPdfPage);
  const setCurrentPdfPage = useAppStore((s) => s.setCurrentPdfPage);
  const setQuotedPdfText = useAppStore((s) => s.setQuotedPdfText);
  const openImport = useAppStore((s) => s.openImport);
  const selectedLectureId = useAppStore((s) => s.selectedLectureId);
  const toast = useToast();

  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const toolbarBg = useColorModeValue('#f7f7f7', '#141414');
  const popoverBg = useColorModeValue('#ffffff', '#1f1f1f');

  // Load PDF document when path changes
  useEffect(() => {
    if (!pdfPath) {
      setPdfDoc(null);
      setTotalPages(0);
      setCurrentPage(1);
      setCurrentPdfPage(1);
      setOutline([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        let doc: pdfjsLib.PDFDocumentProxy;
        // 1. Try binary buffer loading (fast, offline, immune to path escaping & CSP restrictions)
        const fileBuffer = await window.api.readFileBuffer(pdfPath);
        if (fileBuffer) {
          const data = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);
          doc = await pdfjsLib.getDocument({ data }).promise;
        } else {
          // 2. Streamable protocol fallback
          const mediaUrl = toMediaUrl(pdfPath);
          doc = await pdfjsLib.getDocument(mediaUrl).promise;
        }

        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);

          // Restore last read page for this specific lecture or PDF file
          let initialPage = 1;
          const lectureKey = selectedLectureId ? `ilm_lecture_pdf_page_${selectedLectureId}` : null;
          const savedLecturePage = lectureKey ? localStorage.getItem(lectureKey) : null;
          const savedPdfPage = pdfPath ? localStorage.getItem(`ilm_pdf_page_${pdfPath}`) : null;

          if (savedLecturePage) {
            const p = parseInt(savedLecturePage, 10);
            if (!isNaN(p) && p >= 1 && p <= doc.numPages) initialPage = p;
          } else if (savedPdfPage) {
            const p = parseInt(savedPdfPage, 10);
            if (!isNaN(p) && p >= 1 && p <= doc.numPages) initialPage = p;
          }

          setCurrentPage(initialPage);
          setPageInput(String(initialPage));
          setCurrentPdfPage(initialPage);

          // Extract table of contents outline in background
          try {
            const rawOutline = await doc.getOutline();
            if (rawOutline && rawOutline.length > 0) {
              const processOutline = async (items: any[]): Promise<OutlineItem[]> => {
                const processed: OutlineItem[] = [];
                for (const item of items) {
                  let pageNum: number | undefined;
                  if (typeof item.dest === 'string') {
                    const dest = await doc.getDestination(item.dest);
                    if (dest && dest.length > 0) {
                      const pageIndex = await doc.getPageIndex(dest[0]);
                      pageNum = pageIndex + 1;
                    }
                  } else if (Array.isArray(item.dest) && item.dest.length > 0) {
                    const pageIndex = await doc.getPageIndex(item.dest[0]);
                    pageNum = pageIndex + 1;
                  }
                  const subItems =
                    item.items && item.items.length > 0
                      ? await processOutline(item.items)
                      : undefined;

                  processed.push({
                    title: item.title,
                    pageNumber: pageNum,
                    items: subItems,
                  });
                }
                return processed;
              };

              const parsedOutline = await processOutline(rawOutline);
              if (!cancelled) setOutline(parsedOutline);
            }
          } catch (outlineErr) {
            console.warn('PDF outline extraction warning:', outlineErr);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF file');
          console.error('PDF load error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfPath, setCurrentPdfPage]);

  // Jump to page helper
  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(p);
      setPageInput(String(p));
      setCurrentPdfPage(p);
      if (pdfPath) {
        try {
          localStorage.setItem(`ilm_pdf_page_${pdfPath}`, String(p));
          if (selectedLectureId) {
            localStorage.setItem(`ilm_lecture_pdf_page_${selectedLectureId}`, String(p));
          }
        } catch {}
      }
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    [totalPages, setCurrentPdfPage, pdfPath, selectedLectureId]
  );

  // Jump to saved page when selecting a different lecture that shares this PDF
  useEffect(() => {
    if (!pdfDoc || !totalPages || !selectedLectureId) return;
    const lectureKey = `ilm_lecture_pdf_page_${selectedLectureId}`;
    const saved = localStorage.getItem(lectureKey);
    if (saved) {
      const p = parseInt(saved, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages && p !== currentPage) {
        goToPage(p);
      }
    }
  }, [selectedLectureId, pdfDoc, totalPages, goToPage, currentPage]);

  // Handle external jump request (e.g. from clicking page chip in notes)
  useEffect(() => {
    if (targetPdfPage !== null && targetPdfPage >= 1 && targetPdfPage <= totalPages) {
      goToPage(targetPdfPage);
      jumpToPdfPage(null as any);
    }
  }, [targetPdfPage, totalPages, goToPage, jumpToPdfPage]);

  // Render active page instantly (<30ms) on high-performance canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any previous render in flight
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore cancellation
      }
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      // Render text layer overlay for direct Arabic selection & quoting
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);

          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.position = 'absolute';
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontSize}px`;
          span.style.fontSize = `${fontSize}px`;
          span.style.fontFamily = item.fontName || 'sans-serif';
          span.style.color = 'transparent';
          span.style.cursor = 'text';
          span.style.whiteSpace = 'pre';
          span.style.lineHeight = '1';
          span.style.transformOrigin = 'left bottom';
          span.style.userSelect = 'text';
          textLayerRef.current.appendChild(span);
        }
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Smooth mouse wheel scrolling for page turns
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 260) return;

    const el = containerRef.current;
    if (!el || totalPages <= 1) return;

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 15;
    const atTop = el.scrollTop <= 10;

    if (e.deltaY > 40 && atBottom && currentPage < totalPages) {
      lastWheelTimeRef.current = now;
      goToPage(currentPage + 1);
    } else if (e.deltaY < -40 && atTop && currentPage > 1) {
      lastWheelTimeRef.current = now;
      goToPage(currentPage - 1);
    }
  };

  // Keyboard navigation for PDF reading
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentPage < totalPages) goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentPage > 1) goToPage(currentPage - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToPage(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToPage(totalPages);
    }
  };

  // Handle text selection for "Quote in Notes" floating pill
  const handleMouseUp = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length > 1) {
      setSelectedText(text);
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionCoords({
          x: Math.max(10, rect.left + rect.width / 2 - 80),
          y: Math.max(10, rect.top - 40),
        });
      }
    } else {
      setSelectedText('');
      setSelectionCoords(null);
    }
  };

  const handleQuoteInNotes = () => {
    if (!selectedText) return;
    setQuotedPdfText({ text: selectedText, page: currentPage });
    toast({
      title: 'Quoted in Note Editor',
      description: `Page ${currentPage} matn text sent to notes.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right',
    });
    setSelectedText('');
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopySelectedText = () => {
    if (!selectedText) return;
    navigator.clipboard.writeText(selectedText);
    toast({
      title: 'Copied to clipboard',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
    setSelectedText('');
    setSelectionCoords(null);
  };

  // Fit width based on container
  const fitWidth = useCallback(() => {
    if (!pdfDoc || !containerRef.current) return;

    pdfDoc.getPage(currentPage).then((page) => {
      const containerWidth = containerRef.current!.clientWidth - 32;
      const viewport = page.getViewport({ scale: 1.0, rotation });
      const newScale = containerWidth / viewport.width;
      setScale(Math.max(0.4, newScale));
    });
  }, [pdfDoc, currentPage, rotation]);

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = parseInt(pageInput, 10);
      if (!isNaN(num)) goToPage(num);
    }
  };

  // Get CSS filter for canvas night reading
  const getCanvasFilter = () => {
    switch (colorFilter) {
      case 'dark':
        return 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.1)';
      case 'sepia':
        return 'sepia(0.4) contrast(1.05) brightness(0.95)';
      case 'normal':
      default:
        return 'none';
    }
  };

  // No path → placeholder
  if (!pdfPath) {
    return (
      <Flex
        h="100%"
        align="center"
        justify="center"
        direction="column"
        gap={3}
        p={8}
      >
        <Icon as={FiFileText} boxSize={16} color={placeholderColor} />
        <Text color={placeholderColor} fontSize="lg" fontWeight="medium">
          No PDF Attached
        </Text>
        <Text color={placeholderColor} fontSize="sm" textAlign="center" maxW="300px">
          Import a textbook or matn PDF to study alongside the lecture audio.
        </Text>
        <Button
          size="sm"
          colorScheme="green"
          leftIcon={<FiUpload />}
          onClick={() => openImport({ tab: 'pdf' })}
          mt={2}
        >
          Attach / Import PDF
        </Button>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        h="100%"
        align="center"
        justify="center"
        direction="column"
        gap={3}
        p={8}
      >
        <Icon as={FiFileText} boxSize={12} color="red.400" />
        <Text color="red.400" fontSize="md">
          {error}
        </Text>
        <Text color={placeholderColor} fontSize="xs" maxW="350px" textAlign="center">
          {pdfPath}
        </Text>
        <Button
          size="xs"
          variant="outline"
          colorScheme="green"
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
        >
          Retry Loading
        </Button>
      </Flex>
    );
  }

  return (
    <VStack
      h="100%"
      spacing={0}
      align="stretch"
      position="relative"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      _focus={{ outline: 'none' }}
    >
      {/* Floating text selection pill for "Quote in Notes" */}
      {selectionCoords && selectedText && (
        <Box
          position="fixed"
          left={`${selectionCoords.x}px`}
          top={`${selectionCoords.y}px`}
          zIndex={9999}
          bg={popoverBg}
          boxShadow="0 8px 24px rgba(0,0,0,0.3)"
          borderRadius="full"
          p={1}
          border="1px solid"
          borderColor="green.400"
          display="flex"
          alignItems="center"
          gap={1}
        >
          <Button
            size="xs"
            colorScheme="green"
            borderRadius="full"
            leftIcon={<FiEdit3 />}
            onClick={handleQuoteInNotes}
          >
            Quote in Notes (p. {currentPage})
          </Button>
          <IconButton
            size="xs"
            variant="ghost"
            borderRadius="full"
            aria-label="Copy text"
            icon={<FiCopy />}
            onClick={handleCopySelectedText}
          />
        </Box>
      )}

      {/* Toolbar */}
      <HStack
        h="44px"
        px={3}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        justify="space-between"
        flexShrink={0}
        spacing={2}
      >
        {/* Left: Outline, Search, Page navigation */}
        <HStack spacing={1}>
          <Tooltip label="Table of Contents / Outline">
            <IconButton
              aria-label="Table of contents"
              icon={<FiList />}
              size="sm"
              variant="ghost"
              color={outline.length > 0 ? 'green.400' : 'gray.500'}
              isDisabled={outline.length === 0}
              onClick={() => setIsOutlineOpen(true)}
            />
          </Tooltip>

          <Tooltip label="Search in document (Ctrl+F)">
            <IconButton
              aria-label="Search document"
              icon={<FiSearch />}
              size="sm"
              variant={isSearchOpen ? 'solid' : 'ghost'}
              colorScheme={isSearchOpen ? 'green' : undefined}
              onClick={() => setIsSearchOpen((v) => !v)}
            />
          </Tooltip>

          <Box w="1px" h="18px" bg="whiteAlpha.200" mx={0.5} />

          <Tooltip label="Previous page (Arrow Left / Wheel Up)">
            <IconButton
              aria-label="Previous page"
              icon={<FiChevronLeft />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            />
          </Tooltip>

          <HStack spacing={1}>
            <Input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={() => {
                const num = parseInt(pageInput, 10);
                if (!isNaN(num)) goToPage(num);
                else setPageInput(String(currentPage));
              }}
              size="sm"
              w="48px"
              textAlign="center"
              variant="filled"
            />
            <Text fontSize="xs" color="gray.400">
              / {totalPages}
            </Text>
          </HStack>

          <Tooltip label="Next page (Arrow Right / Wheel Down)">
            <IconButton
              aria-label="Next page"
              icon={<FiChevronRight />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            />
          </Tooltip>

          <Box w="1px" h="18px" bg="whiteAlpha.200" mx={0.5} />

          <Tooltip label="Zoom out">
            <IconButton
              aria-label="Zoom out"
              icon={<FiZoomOut />}
              size="sm"
              variant="ghost"
              onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            />
          </Tooltip>

          <Text fontSize="xs" color="gray.400" minW="40px" textAlign="center">
            {Math.round(scale * 100)}%
          </Text>

          <Tooltip label="Zoom in">
            <IconButton
              aria-label="Zoom in"
              icon={<FiZoomIn />}
              size="sm"
              variant="ghost"
              onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            />
          </Tooltip>

          <Tooltip label="Fit width">
            <IconButton
              aria-label="Fit width"
              icon={<FiMaximize />}
              size="sm"
              variant="ghost"
              onClick={fitWidth}
            />
          </Tooltip>
        </HStack>

        {/* Right: Color filters, Rotation */}
        <HStack spacing={1}>
          <Tooltip label={`Color: ${colorFilter === 'dark' ? 'Midnight Dark' : colorFilter === 'sepia' ? 'Warm Sepia' : 'Normal'}`}>
            <Button
              size="xs"
              variant="outline"
              colorScheme={colorFilter === 'dark' ? 'blue' : colorFilter === 'sepia' ? 'yellow' : 'gray'}
              leftIcon={<Icon as={colorFilter === 'dark' ? FiMoon : FiSun} />}
              onClick={() => {
                setColorFilter((prev) =>
                  prev === 'normal' ? 'dark' : prev === 'dark' ? 'sepia' : 'normal'
                );
              }}
            >
              {colorFilter === 'dark' ? 'Dark' : colorFilter === 'sepia' ? 'Sepia' : 'Normal'}
            </Button>
          </Tooltip>

          <Tooltip label="Rotate 90° Clockwise">
            <IconButton
              aria-label="Rotate clockwise"
              icon={<FiRotateCw />}
              size="sm"
              variant="ghost"
              onClick={handleRotate}
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* In-PDF Search Bar */}
      <PdfSearchBar
        pdfDoc={pdfDoc}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onJumpToPage={goToPage}
      />

      {/* Instant Single-Canvas Rendering Area with Wheel Scroll Page Turning */}
      <Box
        ref={containerRef}
        flex={1}
        overflow="auto"
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        p={4}
        onWheel={handleWheel}
        bg={useColorModeValue('gray.50', '#0d1322')}
        css={{
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '4px',
          },
        }}
      >
        {loading ? (
          <Text color="gray.400" alignSelf="center" mt={8}>
            Loading textbook...
          </Text>
        ) : (
          <Box position="relative" display="inline-block" onMouseUp={handleMouseUp}>
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '100%',
                display: 'block',
                borderRadius: '4px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                filter: getCanvasFilter(),
                transition: 'filter 0.2s ease',
              }}
            />
            {/* Transparent Text Layer for Selection */}
            <Box
              ref={textLayerRef}
              position="absolute"
              top={0}
              left={0}
              pointerEvents="auto"
              userSelect="text"
              opacity={1}
            />
          </Box>
        )}
      </Box>

      {/* Outline Drawer (Table of contents) */}
      <PdfOutlineDrawer
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        outline={outline}
        onSelectPage={goToPage}
        currentPage={currentPage}
      />
    </VStack>
  );
};

// Wrap in React.memo so audio playback position / progress updates never re-render PdfViewer!
export const PdfViewer = React.memo(PdfViewerComponent, (prev, next) => {
  return prev.pdfPath === next.pdfPath;
});

export default PdfViewer;
