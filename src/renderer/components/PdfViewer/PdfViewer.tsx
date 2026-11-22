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
} from '@chakra-ui/react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiFileText,
} from 'react-icons/fi';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

interface PdfViewerProps {
  pdfPath: string | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdfPath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pageInput, setPageInput] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholderColor = useColorModeValue('gray.400', 'gray.500');
  const toolbarBg = useColorModeValue('gray.100', '#16213e');

  // Load PDF document when path changes
  useEffect(() => {
    if (!pdfPath) {
      setPdfDoc(null);
      setTotalPages(0);
      setCurrentPage(1);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const doc = await pdfjsLib.getDocument(pdfPath).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setPageInput('1');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF');
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
  }, [pdfPath]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    } catch (err) {
      console.error('Page render error:', err);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Fit width based on container
  const fitWidth = useCallback(() => {
    if (!pdfDoc || !containerRef.current) return;

    pdfDoc.getPage(currentPage).then((page) => {
      const containerWidth = containerRef.current!.clientWidth - 32; // padding
      const viewport = page.getViewport({ scale: 1.0 });
      const newScale = containerWidth / viewport.width;
      setScale(newScale);
    });
  }, [pdfDoc, currentPage]);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    setPageInput(String(p));
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = parseInt(pageInput, 10);
      if (!isNaN(num)) goToPage(num);
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
        <Text color={placeholderColor} fontSize="lg">
          No PDF loaded
        </Text>
        <Text color={placeholderColor} fontSize="sm">
          Select a lecture with an attached PDF to view it here.
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex h="100%" align="center" justify="center" p={8}>
        <Text color="red.400">{error}</Text>
      </Flex>
    );
  }

  return (
    <VStack h="100%" spacing={0} align="stretch">
      {/* Toolbar */}
      <HStack
        px={3}
        py={2}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        spacing={2}
        justify="center"
        flexShrink={0}
      >
        <Tooltip label="Previous page">
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
            w="50px"
            textAlign="center"
            variant="filled"
          />
          <Text fontSize="sm" color="gray.400">
            / {totalPages}
          </Text>
        </HStack>

        <Tooltip label="Next page">
          <IconButton
            aria-label="Next page"
            icon={<FiChevronRight />}
            size="sm"
            variant="ghost"
            isDisabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          />
        </Tooltip>

        <Box w="1px" h="20px" bg="whiteAlpha.200" mx={1} />

        <Tooltip label="Zoom out">
          <IconButton
            aria-label="Zoom out"
            icon={<FiZoomOut />}
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}
          />
        </Tooltip>

        <Text fontSize="sm" color="gray.400" minW="45px" textAlign="center">
          {Math.round(scale * 100)}%
        </Text>

        <Tooltip label="Zoom in">
          <IconButton
            aria-label="Zoom in"
            icon={<FiZoomIn />}
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(5.0, s + 0.25))}
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

      {/* Canvas area */}
      <Box
        ref={containerRef}
        flex={1}
        overflow="auto"
        display="flex"
        justifyContent="center"
        p={4}
        css={{
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '4px',
          },
        }}
      >
        {loading ? (
          <Text color="gray.400" alignSelf="center">
            Loading PDF…
          </Text>
        ) : (
          <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
        )}
      </Box>
    </VStack>
  );
};

export default PdfViewer;
