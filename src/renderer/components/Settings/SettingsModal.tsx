import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Badge,
  Icon,
  useToast,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiMoon,
  FiSun,
  FiClock,
  FiFolder,
  FiInfo,
  FiType,
  FiSliders,
  FiBell,
} from 'react-icons/fi';
import type { AppSettings } from '../../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    playbackSpeed: 1,
    dailyGoalMinutes: 30,
    defaultImportMode: 'ask',
    fontSize: 16,
    arabicFontSize: 22,
    launchReminderEnabled: true,
    chromeReminderEnabled: true,
    minimizeToTrayEnabled: true,
    reminderIntervalHours: 1,
  });
  const [dataPath, setDataPath] = useState('');
  const [saving, setSaving] = useState(false);

  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  const toast = useToast();

  const modalBg = useColorModeValue('#ffffff', '#181818');
  const sectionBg = useColorModeValue('#f7f7f7', 'rgba(255, 255, 255, 0.04)');
  const borderColor = useColorModeValue('#e9e9e9', 'rgba(255, 255, 255, 0.08)');

  useEffect(() => {
    if (isOpen) {
      window.api.getSettings().then((s) => {
        if (s) setSettings(s);
      }).catch(console.error);

      window.api.getDataPath().then((p) => {
        if (p) setDataPath(p);
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleUpdate = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      await window.api.updateSetting(key, value);
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = colorMode === 'dark' ? 'light' : 'dark';
    toggleColorMode();
    handleUpdate('theme', nextTheme);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={modalBg} maxH="85vh" overflow="hidden">
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={FiSettings} color="green.400" />
            <Text>Settings</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody overflowY="auto" px={6} py={2}>
          <Tabs colorScheme="green" variant="enclosed">
            <TabList mb={4}>
              <Tab fontSize="xs">
                <HStack spacing={1.5}>
                  <Icon as={FiType} boxSize={3.5} />
                  <Text>Appearance</Text>
                </HStack>
              </Tab>
              <Tab fontSize="xs">
                <HStack spacing={1.5}>
                  <Icon as={FiClock} boxSize={3.5} />
                  <Text>Study & Playback</Text>
                </HStack>
              </Tab>
              <Tab fontSize="xs">
                <HStack spacing={1.5}>
                  <Icon as={FiBell} boxSize={3.5} />
                  <Text>Reminders & Tray</Text>
                </HStack>
              </Tab>
              <Tab fontSize="xs">
                <HStack spacing={1.5}>
                  <Icon as={FiFolder} boxSize={3.5} />
                  <Text>Storage</Text>
                </HStack>
              </Tab>
              <Tab fontSize="xs">
                <HStack spacing={1.5}>
                  <Icon as={FiInfo} boxSize={3.5} />
                  <Text>About</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Appearance */}
              <TabPanel px={1} py={2}>
                <VStack spacing={5} align="stretch">
                  <HStack justify="space-between" p={3} bg={sectionBg} borderRadius="lg">
                    <VStack align="start" spacing={0.5}>
                      <Text fontSize="sm" fontWeight="semibold">Theme Mode</Text>
                      <Text fontSize="xs" color="gray.400">
                        {colorMode === 'dark' ? 'Dark theme (Islamic midnight navy)' : 'Light theme (Warm parchment)'}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
                      onClick={handleThemeToggle}
                    >
                      {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                  </HStack>

                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Note Font Size</FormLabel>
                      <Badge colorScheme="green">{settings.fontSize}px</Badge>
                    </HStack>
                    <Slider
                      aria-label="Font size"
                      value={settings.fontSize}
                      min={12}
                      max={24}
                      step={1}
                      onChange={(v) => handleUpdate('fontSize', v)}
                      colorScheme="green"
                    >
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                    <Text fontSize={`${settings.fontSize}px`} color="gray.400" mt={2} noOfLines={1}>
                      Sample English text for lecture notes and study summaries.
                    </Text>
                  </Box>

                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Arabic Font Size</FormLabel>
                      <Badge colorScheme="teal">{settings.arabicFontSize}px</Badge>
                    </HStack>
                    <Slider
                      aria-label="Arabic font size"
                      value={settings.arabicFontSize}
                      min={16}
                      max={36}
                      step={1}
                      onChange={(v) => handleUpdate('arabicFontSize', v)}
                      colorScheme="teal"
                    >
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                    <Text
                      fontSize={`${settings.arabicFontSize}px`}
                      color="green.400"
                      mt={2}
                      dir="rtl"
                      fontFamily="'Amiri', serif"
                    >
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — قُلْ رَبِّ زِدْنِي عِلْمًا
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab 2: Study & Playback */}
              <TabPanel px={1} py={2}>
                <VStack spacing={5} align="stretch">
                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Daily Study Goal</FormLabel>
                      <Badge colorScheme="yellow">{settings.dailyGoalMinutes} minutes</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mb={3}>
                      Your target minutes of focused lecture study per day for dashboard tracking.
                    </Text>
                    <Slider
                      aria-label="Daily goal minutes"
                      value={settings.dailyGoalMinutes}
                      min={10}
                      max={180}
                      step={5}
                      onChange={(v) => handleUpdate('dailyGoalMinutes', v)}
                      colorScheme="yellow"
                    >
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                  </Box>

                  <FormControl p={4} bg={sectionBg} borderRadius="lg">
                    <FormLabel fontSize="sm" fontWeight="semibold">Default Playback Speed</FormLabel>
                    <Select
                      size="sm"
                      value={settings.playbackSpeed}
                      onChange={(e) => handleUpdate('playbackSpeed', parseFloat(e.target.value))}
                      maxW="200px"
                    >
                      <option value="0.75">0.75x (Slower)</option>
                      <option value="1">1.0x (Normal)</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="1.75">1.75x</option>
                      <option value="2">2.0x (Fast)</option>
                    </Select>
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* Tab 3: Reminders & Tray */}
              <TabPanel px={1} py={2}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" p={4} bg={sectionBg} borderRadius="lg">
                    <VStack align="start" spacing={1} maxW="75%">
                      <Text fontSize="sm" fontWeight="semibold">App Launch Study Reminder</Text>
                      <Text fontSize="xs" color="gray.400">
                        Receive a native desktop notification showing today's study progress and pending reviews when opening Ilm Studio.
                      </Text>
                    </VStack>
                    <Switch
                      colorScheme="green"
                      isChecked={settings.launchReminderEnabled}
                      onChange={(e) => handleUpdate('launchReminderEnabled', e.target.checked)}
                    />
                  </HStack>

                  <HStack justify="space-between" p={4} bg={sectionBg} borderRadius="lg">
                    <VStack align="start" spacing={1} maxW="75%">
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold">Google Chrome Study Intervention</Text>
                        <Badge colorScheme="green" fontSize="3xs">Smart Reminder</Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.400">
                        Receive a gentle notification when Google Chrome is opened if you have not finished today's daily study target yet.
                      </Text>
                    </VStack>
                    <Switch
                      colorScheme="green"
                      isChecked={settings.chromeReminderEnabled}
                      onChange={(e) => handleUpdate('chromeReminderEnabled', e.target.checked)}
                    />
                  </HStack>

                  <HStack justify="space-between" p={4} bg={sectionBg} borderRadius="lg">
                    <VStack align="start" spacing={1} maxW="75%">
                      <Text fontSize="sm" fontWeight="semibold">Minimize to System Tray</Text>
                      <Text fontSize="xs" color="gray.400">
                        When closing the window, keep Ilm Studio running quietly in the background tray to continue background Chrome monitoring and audio.
                      </Text>
                    </VStack>
                    <Switch
                      colorScheme="green"
                      isChecked={settings.minimizeToTrayEnabled}
                      onChange={(e) => handleUpdate('minimizeToTrayEnabled', e.target.checked)}
                    />
                  </HStack>

                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <HStack justify="space-between" mb={1}>
                      <FormLabel fontSize="sm" fontWeight="semibold" mb={0}>Chrome Reminder Cooldown</FormLabel>
                      <Badge colorScheme="blue">Every {settings.reminderIntervalHours}h</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mb={3}>
                      Minimum hours between Chrome study reminders so you are never spammed.
                    </Text>
                    <Slider
                      aria-label="Reminder interval"
                      value={settings.reminderIntervalHours || 1}
                      min={1}
                      max={6}
                      step={1}
                      onChange={(v) => handleUpdate('reminderIntervalHours', v)}
                      colorScheme="blue"
                    >
                      <SliderTrack><SliderFilledTrack /></SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab 4: Storage */}
              <TabPanel px={1} py={2}>
                <VStack spacing={4} align="stretch">
                  <FormControl p={4} bg={sectionBg} borderRadius="lg">
                    <FormLabel fontSize="sm" fontWeight="semibold">File Import Preference</FormLabel>
                    <Text fontSize="xs" color="gray.400" mb={3}>
                      How files should be handled when imported into courses.
                    </Text>
                    <Select
                      size="sm"
                      value={settings.defaultImportMode}
                      onChange={(e) => handleUpdate('defaultImportMode', e.target.value as any)}
                    >
                      <option value="ask">Always ask on import (Default)</option>
                      <option value="copy">Always copy to Ilm Studio internal library</option>
                      <option value="reference">Reference original file path without copying</option>
                    </Select>
                  </FormControl>

                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>Application Data Directory</Text>
                    <Text fontSize="xs" color="gray.400" mb={2}>
                      Location of your local SQLite database and managed library files:
                    </Text>
                    <Box
                      p={2.5}
                      bg="blackAlpha.300"
                      borderRadius="md"
                      fontSize="xs"
                      fontFamily="mono"
                      color="green.300"
                      userSelect="all"
                    >
                      {dataPath || 'Loading...'}
                    </Box>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab 4: About */}
              <TabPanel px={1} py={2}>
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg={sectionBg} borderRadius="lg" textAlign="center">
                    <Heading size="md" color="green.400">🕌 Ilm Studio (عِلم ستوديو)</Heading>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Version 1.7.0 (Phase 7: Settings, Tags & Quality of Life)
                    </Text>
                    <Text fontSize="sm" mt={3} color={useColorModeValue('gray.600', 'gray.300')}>
                      An advanced Islamic lecture study desktop application for deep listening, textbook reading, and Quran-linked note taking.
                    </Text>
                  </Box>

                  <Box p={4} bg={sectionBg} borderRadius="lg">
                    <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.400" mb={2}>
                      Privacy & Architecture
                    </Heading>
                    <Text fontSize="xs" color="gray.400" lineHeight="tall">
                      🔒 <strong>100% Offline & Private</strong>: Ilm Studio requires no internet connection, has zero analytics or telemetry, and keeps all notes, study logs, and media locally on your machine.
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button size="sm" colorScheme="green" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;
