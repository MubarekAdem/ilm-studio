import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Text } from '@chakra-ui/react';
import * as pdfjsLib from 'pdfjs-dist';

export type ColorFilterMode = 'normal' | 'dark' | 'sepia';

export interface PdfPageItemProps {
  pageNumber: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  scale: number;
  rotation: number;
  colorFilter: ColorFilterMode;
  defaultWidth: number;
  defaultHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onMouseUp: (pageNumber: number) => void;
}

const getCanvasFilter = (filter: ColorFilterMode) => {
  switch (filter) {
    case 'dark':
      return 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.1)';
    case 'sepia':
      return 'sepia(0.4) contrast(1.05) brightness(0.95)';
    case 'normal':
    default:
      return 'none';
  }
};

const getPlaceholderBg = (filter: ColorFilterMode) => {
  switch (filter) {
    case 'dark':
      return '#171c26';
    case 'sepia':
      return '#f5edd6';
    case 'normal':
    default:
      return '#ffffff';
  }
};

const PdfPageItemComponent: React.FC<PdfPageItemProps> = ({
  pageNumber,
  pdfDoc,
  scale,
  rotation,
  colorFilter,
  defaultWidth,
  defaultHeight,
  containerRef,
  onMouseUp,
}) => {
  const pageBoxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [renderedWidth, setRenderedWidth] = useState<number | null>(null);
  const [renderedHeight, setRenderedHeight] = useState<number | null>(null);

  // Compute dimensions based on rotation and scale
  const isRotatedSideways = rotation % 180 !== 0;
  const baseW = isRotatedSideways ? defaultHeight : defaultWidth;
  const baseH = isRotatedSideways ? defaultWidth : defaultHeight;
  const pageW = renderedWidth !== null ? renderedWidth : Math.round(baseW * scale);
  const pageH = renderedHeight !== null ? renderedHeight : Math.round(baseH * scale);

  // IntersectionObserver to only render visible + nearby pages (buffer of 800px)
  useEffect(() => {
    const el = pageBoxRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      {
        root: container,
        rootMargin: '800px 0px 800px 0px',
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  // Render canvas & text layer when visible
  const renderPage = useCallback(async () => {
    if (!isVisible || !pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setRenderedWidth(viewport.width);
      setRenderedHeight(viewport.height);

      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Render text layer for selection & quoting
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
        console.error(`Page ${pageNumber} render error:`, err);
      }
    }
  }, [isVisible, pdfDoc, pageNumber, scale, rotation]);

  useEffect(() => {
    if (isVisible) {
      renderPage();
    } else {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    }
  }, [isVisible, renderPage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, []);

  const placeholderBg = getPlaceholderBg(colorFilter);

  return (
    <Box
      ref={pageBoxRef}
      data-page-number={pageNumber}
      w={`${pageW}px`}
      h={`${pageH}px`}
      minH={`${pageH}px`}
      position="relative"
      my={3}
      borderRadius="4px"
      bg={placeholderBg}
      boxShadow="0 4px 16px rgba(0,0,0,0.25)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      onMouseUp={() => onMouseUp(pageNumber)}
    >
      {isVisible ? (
        <>
          <canvas
            ref={canvasRef}
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              maxWidth: '100%',
              display: 'block',
              borderRadius: '4px',
              filter: getCanvasFilter(colorFilter),
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
          {/* Page Number Badge */}
          <Box
            position="absolute"
            bottom={2}
            right={2}
            px={2}
            py={0.5}
            borderRadius="md"
            bg="rgba(0,0,0,0.55)"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            pointerEvents="none"
            opacity={0.75}
          >
            {pageNumber}
          </Box>
        </>
      ) : (
        <Text fontSize="xs" color="gray.500" fontWeight="medium">
          Page {pageNumber}
        </Text>
      )}
    </Box>
  );
};

export const PdfPageItem = React.memo(PdfPageItemComponent, (prev, next) => {
  return (
    prev.pageNumber === next.pageNumber &&
    prev.scale === next.scale &&
    prev.rotation === next.rotation &&
    prev.colorFilter === next.colorFilter &&
    prev.defaultWidth === next.defaultWidth &&
    prev.defaultHeight === next.defaultHeight &&
    prev.pdfDoc === next.pdfDoc
  );
});

export default PdfPageItem;
