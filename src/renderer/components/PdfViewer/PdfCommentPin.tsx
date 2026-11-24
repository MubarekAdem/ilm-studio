import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  IconButton,
  HStack,
  VStack,
  Textarea,
  Tooltip,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
} from '@chakra-ui/react';
import {
  FiMessageSquare,
  FiEdit3,
  FiTrash2,
  FiMinimize2,
  FiMaximize2,
  FiCheck,
  FiCornerDownRight,
  FiRotateCcw,
} from 'react-icons/fi';
import type { PdfComment, PdfCommentColor, PdfCommentFontStyle } from '../../../shared/types';

interface PdfCommentPinProps {
  comment: PdfComment;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, data: Partial<PdfComment>) => void;
  onDelete: (id: string) => void;
}

const COLOR_MAP: Record<
  PdfCommentColor,
  {
    pinBg: string;
    pinGlow: string;
    cardBgDark: string;
    cardBgLight: string;
    borderDark: string;
    borderLight: string;
    textDark: string;
    textLight: string;
  }
> = {
  amber: {
    pinBg: '#f59e0b',
    pinGlow: 'rgba(245, 158, 11, 0.45)',
    cardBgDark: '#1c1815',
    cardBgLight: '#fffbeb',
    borderDark: '#78350f',
    borderLight: '#fde68a',
    textDark: '#fbbf24',
    textLight: '#b45309',
  },
  emerald: {
    pinBg: '#10b981',
    pinGlow: 'rgba(16, 185, 129, 0.45)',
    cardBgDark: '#0d1f18',
    cardBgLight: '#f0fdf4',
    borderDark: '#065f46',
    borderLight: '#a7f3d0',
    textDark: '#34d399',
    textLight: '#047857',
  },
  sky: {
    pinBg: '#0ea5e9',
    pinGlow: 'rgba(14, 165, 233, 0.45)',
    cardBgDark: '#0e1d2c',
    cardBgLight: '#f0f9ff',
    borderDark: '#0369a1',
    borderLight: '#bae6fd',
    textDark: '#38bdf8',
    textLight: '#0369a1',
  },
  rose: {
    pinBg: '#f43f5e',
    pinGlow: 'rgba(244, 63, 94, 0.45)',
    cardBgDark: '#220e14',
    cardBgLight: '#fff1f2',
    borderDark: '#9f1239',
    borderLight: '#fecdd3',
    textDark: '#fb7185',
    textLight: '#be123c',
  },
  violet: {
    pinBg: '#8b5cf6',
    pinGlow: 'rgba(139, 92, 246, 0.45)',
    cardBgDark: '#181128',
    cardBgLight: '#f5f3ff',
    borderDark: '#5b21b6',
    borderLight: '#ddd6fe',
    textDark: '#a78bfa',
    textLight: '#6d28d9',
  },
};

const COLOR_OPTIONS: PdfCommentColor[] = ['amber', 'emerald', 'sky', 'rose', 'violet'];

export const PdfCommentPin: React.FC<PdfCommentPinProps> = ({
  comment,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isSelected);
  const [localContent, setLocalContent] = useState<string>(comment.content);
  const [activeTab, setActiveTab] = useState<number>(comment.drawingData && !comment.content ? 1 : 0);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isDark = useColorModeValue(false, true);
  const cMeta = COLOR_MAP[comment.color] || COLOR_MAP.amber;

  // Sync external selection
  useEffect(() => {
    if (isSelected) {
      setIsExpanded(true);
    }
  }, [isSelected]);

  // Sync content if updated externally
  useEffect(() => {
    setLocalContent(comment.content);
  }, [comment.content]);

  // Redraw canvas if drawingData exists
  useEffect(() => {
    if (activeTab === 1 && canvasRef.current && comment.drawingData) {
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, cvs.width, cvs.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = comment.drawingData;
      }
    }
  }, [activeTab, comment.drawingData]);

  // Handle freehand drawing events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const rect = cvs.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDrawing(true);
    ctx.strokeStyle = cMeta.pinBg;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const rect = cvs.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e) e.stopPropagation();
    setIsDrawing(false);
    const cvs = canvasRef.current;
    if (cvs) {
      const dataUrl = cvs.toDataURL('image/png');
      onUpdate(comment.id, { drawingData: dataUrl });
    }
  };

  const clearCanvas = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      onUpdate(comment.id, { drawingData: null });
    }
  };

  const handleBlurText = () => {
    if (localContent !== comment.content) {
      onUpdate(comment.id, { content: localContent });
    }
  };

  const handleToggleFont = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStyle: PdfCommentFontStyle =
      comment.fontStyle === 'handwriting' ? 'sans' : 'handwriting';
    onUpdate(comment.id, { fontStyle: nextStyle });
  };

  const handleColorChange = (color: PdfCommentColor, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(comment.id, { color });
  };

  // Determine smart card positioning so it doesn't clip outside page
  const cardAlignLeft = comment.xPct > 65;
  const cardAlignTop = comment.yPct > 70;

  return (
    <Box
      position="absolute"
      left={`${comment.xPct}%`}
      top={`${comment.yPct}%`}
      transform="translate(-50%, -50%)"
      zIndex={isExpanded ? 110 : 25}
      pointerEvents="auto"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* ── Collapsed / Root Pin ────────────────────────────────────── */}
      <Tooltip
        label={
          !isExpanded && (comment.content || comment.drawingData)
            ? comment.content
              ? comment.content.slice(0, 60) + (comment.content.length > 60 ? '...' : '')
              : '🎨 Hand-drawn note'
            : 'Click to open note'
        }
        placement="top"
        hasArrow
        isDisabled={isExpanded}
      >
        <Box
          as="button"
          w="26px"
          h="26px"
          borderRadius="full"
          bg={cMeta.pinBg}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow={`0 2px 8px ${cMeta.pinGlow}, 0 0 0 ${isSelected ? '3px' : '1.5px'} rgba(255,255,255,0.9)`}
          transition="all 0.18s cubic-bezier(0.16, 1, 0.3, 1)"
          cursor="pointer"
          _hover={{
            transform: 'scale(1.18)',
            boxShadow: `0 4px 14px ${cMeta.pinGlow}, 0 0 0 3px rgba(255,255,255,1)`,
          }}
          _active={{ transform: 'scale(0.95)' }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsExpanded((v) => !v);
            onSelect();
          }}
        >
          {comment.fontStyle === 'handwriting' ? (
            <FiEdit3 size={13} />
          ) : (
            <FiMessageSquare size={13} />
          )}
        </Box>
      </Tooltip>

      {/* ── Collapsible Floating Card ───────────────────────────────── */}
      {isExpanded && (
        <Box
          position="absolute"
          top={cardAlignTop ? 'auto' : '32px'}
          bottom={cardAlignTop ? '32px' : 'auto'}
          left={cardAlignLeft ? 'auto' : '-10px'}
          right={cardAlignLeft ? '-10px' : 'auto'}
          w="290px"
          bg={isDark ? cMeta.cardBgDark : cMeta.cardBgLight}
          border="1.5px solid"
          borderColor={isDark ? cMeta.borderDark : cMeta.borderLight}
          borderRadius="lg"
          boxShadow="0 12px 32px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.15)"
          p={2.5}
          cursor="default"
          onClick={(e) => e.stopPropagation()}
          animation="popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)"
          sx={{
            '@keyframes popIn': {
              '0%': { opacity: 0, transform: 'scale(0.92)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          {/* Card Header */}
          <HStack justify="space-between" mb={2}>
            {/* Color Palette Dots */}
            <HStack spacing={1.5}>
              {COLOR_OPTIONS.map((c) => (
                <Box
                  key={c}
                  as="button"
                  w="14px"
                  h="14px"
                  borderRadius="full"
                  bg={COLOR_MAP[c].pinBg}
                  boxShadow={comment.color === c ? '0 0 0 2px white' : 'none'}
                  opacity={comment.color === c ? 1 : 0.6}
                  _hover={{ opacity: 1, transform: 'scale(1.2)' }}
                  onClick={(e: React.MouseEvent) => handleColorChange(c, e)}
                />
              ))}
            </HStack>

            {/* Font & Actions */}
            <HStack spacing={1}>
              <Tooltip label={comment.fontStyle === 'handwriting' ? 'Switch to Sans font' : 'Switch to Handwriting font'}>
                <Button
                  size="xs"
                  variant="ghost"
                  px={1.5}
                  h="20px"
                  fontSize="2xs"
                  colorScheme={comment.fontStyle === 'handwriting' ? 'green' : 'gray'}
                  onClick={handleToggleFont}
                >
                  {comment.fontStyle === 'handwriting' ? '✍️ Hand' : 'Aa Sans'}
                </Button>
              </Tooltip>

              <Tooltip label="Collapse note">
                <IconButton
                  aria-label="Collapse note"
                  icon={<FiMinimize2 size={12} />}
                  size="xs"
                  variant="ghost"
                  h="20px"
                  w="20px"
                  minW="20px"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                />
              </Tooltip>

              <Tooltip label="Delete note">
                <IconButton
                  aria-label="Delete note"
                  icon={<FiTrash2 size={12} />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  h="20px"
                  w="20px"
                  minW="20px"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(comment.id);
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>

          {/* Mode Tabs: Text Note vs Freehand Handwriting Drawing */}
          <Tabs
            size="xs"
            variant="soft-rounded"
            colorScheme="green"
            index={activeTab}
            onChange={(idx) => setActiveTab(idx)}
          >
            <TabList mb={1.5} gap={1}>
              <Tab fontSize="2xs" px={2} py={0.5}>
                Text Note
              </Tab>
              <Tab fontSize="2xs" px={2} py={0.5}>
                ✍️ Ink Sketch
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Text Note */}
              <TabPanel p={0}>
                <Textarea
                  ref={textareaRef}
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  onBlur={handleBlurText}
                  placeholder="Write textbook note, reflection, or explanation..."
                  size="sm"
                  rows={4}
                  bg={isDark ? 'blackAlpha.400' : 'whiteAlpha.800'}
                  border="1px solid"
                  borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.200'}
                  borderRadius="md"
                  fontFamily={
                    comment.fontStyle === 'handwriting'
                      ? "'Caveat', 'Segoe Print', 'Bradley Hand', 'Amiri', cursive, serif"
                      : 'inherit'
                  }
                  fontSize={comment.fontStyle === 'handwriting' ? '17px' : 'xs'}
                  lineHeight={comment.fontStyle === 'handwriting' ? '1.3' : 'normal'}
                  fontWeight={comment.fontStyle === 'handwriting' ? 600 : 400}
                  color={isDark ? 'gray.100' : 'gray.800'}
                  resize="vertical"
                  _focus={{
                    borderColor: cMeta.pinBg,
                    boxShadow: `0 0 0 1px ${cMeta.pinBg}`,
                  }}
                />
              </TabPanel>

              {/* Tab 2: Freehand Handwriting Drawing */}
              <TabPanel p={0}>
                <Box
                  position="relative"
                  borderRadius="md"
                  border="1px dashed"
                  borderColor={isDark ? 'whiteAlpha.200' : 'blackAlpha.300'}
                  bg={isDark ? 'blackAlpha.500' : 'white'}
                  overflow="hidden"
                >
                  <canvas
                    ref={canvasRef}
                    width={266}
                    height={110}
                    style={{
                      display: 'block',
                      cursor: 'crosshair',
                      touchAction: 'none',
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <HStack
                    position="absolute"
                    bottom={1}
                    right={1}
                    spacing={1}
                    bg={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'}
                    borderRadius="sm"
                    p={0.5}
                  >
                    <Tooltip label="Clear sketch">
                      <IconButton
                        aria-label="Clear sketch"
                        icon={<FiRotateCcw size={10} />}
                        size="xs"
                        h="18px"
                        w="18px"
                        minW="18px"
                        variant="ghost"
                        onClick={clearCanvas}
                      />
                    </Tooltip>
                  </HStack>
                </Box>
                <Text fontSize="3xs" color="gray.400" mt={1} textAlign="center">
                  Draw or write with your mouse/stylus
                </Text>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Card Footer: Page Indicator & Done Button */}
          <HStack justify="space-between" mt={2} pt={1.5} borderTop="1px solid" borderColor="whiteAlpha.100">
            <Text fontSize="3xs" color="gray.400" fontWeight="medium">
              p. {comment.page} • auto-saved
            </Text>
            <Button
              size="xs"
              h="22px"
              px={2}
              colorScheme="green"
              variant="solid"
              leftIcon={<FiCheck size={11} />}
              onClick={(e) => {
                e.stopPropagation();
                handleBlurText();
                setIsExpanded(false);
              }}
            >
              Done
            </Button>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default PdfCommentPin;
