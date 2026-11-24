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
  FiLayers,
  FiSquare,
  FiBookOpen,
} from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { useAppStore } from '../../stores/appStore';
import { PdfOutlineDrawer, OutlineItem } from './PdfOutlineDrawer';
import { PdfSearchBar } from './PdfSearchBar';
import { PdfPageItem, ColorFilterMode } from './PdfPageItem';
import { toMediaUrl } from '../../utils/mediaUrl';

interface PdfViewerProps {
  pdfPath: string | null;
}

type ViewMode = 'continuous' | 'single';

const PdfViewerComponent: React.FC<PdfViewerProps> = ({ pdfPath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInputFocusedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, []);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [defaultWidth, setDefaultWidth] = useState(595);
  const [defaultHeight, setDefaultHeight] = useState(842);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [colorFilter, setColorFilter] = useState<ColorFilterMode>('normal');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('ilm_pdf_view_mode');
      if (saved === 'single' || saved === 'continuous') return saved;
    } catch {}
    return 'continuous';
  });
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
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
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
  const containerBg = useColorModeValue('gray.100', '#0a0d14');

  // Jump to page helper
  const goToPage = useCallback(
    (page: number, smooth: boolean = false) => {
      const p = Math.max(1, Math.min(page, totalPages || 1));
      setCurrentPage(p);
      if (!isInputFocusedRef.current) {
        setPageInput(String(p));
      }
      setCurrentPdfPage(p);
      if (pdfPath) {
        try {
          localStorage.setItem(`ilm_pdf_page_${pdfPath}`, String(p));
          if (selectedLectureId) {
            localStorage.setItem(`ilm_lecture_pdf_page_${selectedLectureId}`, String(p));
          }
        } catch {}
      }

      if (viewMode === 'continuous') {
        const container = containerRef.current;
        if (container) {
          const el = container.querySelector<HTMLElement>(`[data-page-number="${p}"]`);
          if (el) {
            if (programmaticTimerRef.current) {
              clearTimeout(programmaticTimerRef.current);
            }
            isProgrammaticScrollRef.current = true;

            const containerRect = container.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 16;

            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: smooth ? 'smooth' : 'auto',
            });

            programmaticTimerRef.current = setTimeout(() => {
              isProgrammaticScrollRef.current = false;
            }, smooth ? 600 : 150);
          }
        }
      } else {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    },
    [totalPages, setCurrentPdfPage, pdfPath, selectedLectureId, viewMode]
  );

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

          // Get dimensions from first page for smooth placeholders
          try {
            const firstPage = await doc.getPage(1);
            const vp1 = firstPage.getViewport({ scale: 1.0, rotation: 0 });
            setDefaultWidth(vp1.width);
            setDefaultHeight(vp1.height);
          } catch {}

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

          // Scroll to initial page once pages are mounted
          setTimeout(() => {
            if (!cancelled && initialPage > 1 && containerRef.current) {
              const el = containerRef.current.querySelector<HTMLElement>(`[data-page-number="${initialPage}"]`);
              if (el) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const targetScrollTop = containerRef.current.scrollTop + (elRect.top - containerRect.top) - 16;
                containerRef.current.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'auto' });
              }
            }
          }, 150);

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

                  processed.push({
                    title: item.title,
                    pageNumber: pageNum,
                    items: item.items && item.items.length > 0 ? await processOutline(item.items) : undefined,
                  });
                }
                return processed;
              };

              const processedOutline = await processOutline(rawOutline);
              if (!cancelled) setOutline(processedOutline);
            } else {
              if (!cancelled) setOutline([]);
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfPath, setCurrentPdfPage, selectedLectureId]);

  // Jump to saved page when selecting a different lecture that shares this PDF
  useEffect(() => {
    if (!pdfDoc || !totalPages || !selectedLectureId) return;
    const lectureKey = `ilm_lecture_pdf_page_${selectedLectureId}`;
    const saved = localStorage.getItem(lectureKey);
    if (saved) {
      const p = parseInt(saved, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages && p !== currentPage) {
        goToPage(p, false);
      }
    }
  }, [selectedLectureId, pdfDoc, totalPages, goToPage, currentPage]);

  // Handle external jump request (e.g. from clicking page chip in notes)
  useEffect(() => {
    if (targetPdfPage !== null && targetPdfPage >= 1 && targetPdfPage <= totalPages) {
      goToPage(targetPdfPage, false);
      jumpToPdfPage(null as any);
    }
  }, [targetPdfPage, totalPages, goToPage, jumpToPdfPage]);

  // Track active page during continuous scroll
  const updateActivePageFromScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container || totalPages <= 0) return;

    const containerRect = container.getBoundingClientRect();
    const targetY = containerRect.top + Math.min(200, containerRect.height * 0.3);

    const pageElements = container.querySelectorAll<HTMLElement>('[data-page-number]');
    let bestPage = currentPage;
    for (let i = 0; i < pageElements.length; i++) {
      const el = pageElements[i];
      const rect = el.getBoundingClientRect();
      if (rect.top <= targetY && rect.bottom >= targetY) {
        bestPage = parseInt(el.getAttribute('data-page-number') || '1', 10);
        break;
      }
      if (rect.top > targetY) {
        break;
      }
    }

    if (bestPage && bestPage !== currentPage) {
      setCurrentPage(bestPage);
      if (!isInputFocusedRef.current) {
        setPageInput(String(bestPage));
      }
      setCurrentPdfPage(bestPage);
      if (pdfPath) {
        try {
          localStorage.setItem(`ilm_pdf_page_${pdfPath}`, String(bestPage));
          if (selectedLectureId) {
            localStorage.setItem(`ilm_lecture_pdf_page_${selectedLectureId}`, String(bestPage));
          }
        } catch {}
      }
    }
  }, [currentPage, totalPages, setCurrentPdfPage, pdfPath, selectedLectureId]);

  const handleContainerScroll = useCallback(() => {
    if (viewMode !== 'continuous') return;
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      updateActivePageFromScroll();
    });
  }, [viewMode, updateActivePageFromScroll]);

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
  const handlePageMouseUp = (pageNumber: number) => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length > 1) {
      setSelectedText(text);
      setSelectedPage(pageNumber);
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
    const pageToQuote = selectedPage || currentPage;
    setQuotedPdfText({ text: selectedText, page: pageToQuote });
    toast({
      title: 'Quoted in Note Editor',
      description: `Page ${pageToQuote} text sent to notes.`,
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
  const fitWidth = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage || 1);
      const containerWidth = containerRef.current.clientWidth - 48;
      const viewport = page.getViewport({ scale: 1.0, rotation });
      const newScale = containerWidth / viewport.width;
      setScale(Math.max(0.4, Math.min(3.0, newScale)));
    } catch (e) {
      console.error('Fit width error:', e);
    }
  }, [pdfDoc, currentPage, rotation]);

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = parseInt(pageInput, 10);
      if (!isNaN(num) && num >= 1) {
        goToPage(num, false);
      } else {
        setPageInput(String(currentPage));
      }
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setPageInput(String(currentPage));
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePageInputBlur = () => {
    isInputFocusedRef.current = false;
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      if (num !== currentPage) {
        goToPage(num, false);
      }
    } else {
      setPageInput(String(currentPage));
    }
  };

  const toggleViewMode = () => {
    const nextMode: ViewMode = viewMode === 'continuous' ? 'single' : 'continuous';
    setViewMode(nextMode);
    try {
      localStorage.setItem('ilm_pdf_view_mode', nextMode);
    } catch {}
    // Re-align to currentPage
    setTimeout(() => {
      goToPage(currentPage, false);
    }, 50);
  };

  const handleOpenPdfDirectly = async () => {
    try {
      const result = await window.api.openFileDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        properties: ['openFile'],
      });
      if (result && result.length > 0) {
        const chosenPath = result[0];
        try {
          localStorage.setItem('ilm_last_pdf_path', chosenPath);
        } catch {}
        if (selectedLectureId) {
          window.api.updateLecture(selectedLectureId, { pdfPath: chosenPath }).catch(console.error);
        }
        window.dispatchEvent(new CustomEvent('ilm_direct_pdf_opened', { detail: chosenPath }));
      }
    } catch (err) {
      console.error('File dialog error:', err);
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
        p={8}
        bg={useColorModeValue('gray.50', '#0f172a')}
      >
        <Icon as={FiFileText} boxSize={14} color="gray.500" mb={4} />
        <Text fontSize="lg" fontWeight="semibold" color="gray.300" mb={1}>
          No PDF Attached
        </Text>
        <Text fontSize="sm" color={placeholderColor} textAlign="center" maxW="400px" mb={6}>
          Open a textbook or matn PDF to study alongside your current audio lecture.
        </Text>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiUpload />}
            colorScheme="green"
            size="sm"
            variant="solid"
            onClick={handleOpenPdfDirectly}
          >
            Open PDF File
          </Button>
          <Button
            leftIcon={<FiBookOpen />}
            colorScheme="green"
            size="sm"
            variant="outline"
            onClick={() => openImport({ tab: 'pdf' })}
          >
            Attach / Import to Course
          </Button>
        </HStack>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Flex
        h="100%"
        align="center"
        justify="center"
        direction="column"
        p={8}
        bg={useColorModeValue('gray.50', '#0f172a')}
        gap={3}
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
            Quote in Notes (p. {selectedPage || currentPage})
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
        {/* Left: Outline, Search, View Mode, Page navigation */}
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

          <Tooltip label={viewMode === 'continuous' ? 'Continuous Global Scroll (click for single page)' : 'Single Page View (click for continuous scroll)'}>
            <IconButton
              aria-label="Toggle scroll mode"
              icon={viewMode === 'continuous' ? <FiLayers /> : <FiSquare />}
              size="sm"
              variant="ghost"
              colorScheme={viewMode === 'continuous' ? 'green' : undefined}
              onClick={toggleViewMode}
            />
          </Tooltip>

          <Tooltip label="Open / Switch PDF file">
            <IconButton
              aria-label="Open PDF file"
              icon={<FiUpload />}
              size="sm"
              variant="ghost"
              onClick={handleOpenPdfDirectly}
            />
          </Tooltip>

          <Box w="1px" h="18px" bg="whiteAlpha.200" mx={0.5} />

          <Tooltip label="Previous page (Arrow Left / Page Up)">
            <IconButton
              aria-label="Previous page"
              icon={<FiChevronLeft />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1, false)}
            />
          </Tooltip>

          <HStack spacing={1}>
            <Tooltip label="Type page number & press Enter">
              <Input
                value={pageInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPageInput(val);
                }}
                onFocus={(e) => {
                  isInputFocusedRef.current = true;
                  e.target.select();
                }}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputBlur}
                size="sm"
                w="56px"
                px={1}
                fontSize="xs"
                fontWeight="semibold"
                textAlign="center"
                variant="filled"
                aria-label="Current page number"
              />
            </Tooltip>
            <Text fontSize="xs" color="gray.400" userSelect="none">
              / {totalPages}
            </Text>
          </HStack>

          <Tooltip label="Next page (Arrow Right / Page Down)">
            <IconButton
              aria-label="Next page"
              icon={<FiChevronRight />}
              size="sm"
              variant="ghost"
              isDisabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1, false)}
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
        onJumpToPage={(p) => goToPage(p, false)}
      />

      {/* Continuous Global Scroll / Single Page Area */}
      <Box
        ref={containerRef}
        position="relative"
        flex={1}
        overflowY="auto"
        overflowX="auto"
        display="flex"
        flexDirection="column"
        alignItems="center"
        p={4}
        onScroll={handleContainerScroll}
        bg={containerBg}
        css={{
          '&::-webkit-scrollbar': { width: '10px', height: '10px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '5px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255,255,255,0.3)',
          },
        }}
      >
        {loading ? (
          <Text color="gray.400" alignSelf="center" mt={8}>
            Loading textbook...
          </Text>
        ) : pdfDoc && totalPages > 0 ? (
          viewMode === 'continuous' ? (
            Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <PdfPageItem
                key={pageNum}
                pageNumber={pageNum}
                pdfDoc={pdfDoc}
                scale={scale}
                rotation={rotation}
                colorFilter={colorFilter}
                defaultWidth={defaultWidth}
                defaultHeight={defaultHeight}
                containerRef={containerRef}
                onMouseUp={handlePageMouseUp}
              />
            ))
          ) : (
            <PdfPageItem
              key={currentPage}
              pageNumber={currentPage}
              pdfDoc={pdfDoc}
              scale={scale}
              rotation={rotation}
              colorFilter={colorFilter}
              defaultWidth={defaultWidth}
              defaultHeight={defaultHeight}
              containerRef={containerRef}
              onMouseUp={handlePageMouseUp}
            />
          )
        ) : null}
      </Box>

      {/* Outline Drawer (Table of contents) */}
      <PdfOutlineDrawer
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        outline={outline}
        onSelectPage={(p) => goToPage(p, false)}
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
