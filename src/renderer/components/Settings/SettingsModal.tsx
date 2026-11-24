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
  FiDatabase,
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiAlertTriangle,
  FiArchive,
  FiRefreshCw,
} from 'react-icons/fi';
import type {
  AppSettings,
  BackupCreateResult,
  BackupInspectResult,
  BackupRestoreResult,
} from '../../../shared/types';

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

  // ── Backup & Restore State ──────────────────────────────────────────
  const [includeMediaInBackup, setIncludeMediaInBackup] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<BackupCreateResult | null>(null);

  const [inspectResult, setInspectResult] = useState<BackupInspectResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'clean'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastRestoreResult, setLastRestoreResult] = useState<BackupRestoreResult | null>(null);

  const handleCreateBackup = async () => {
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      const defaultName = `ilm-studio-backup-${nowStr}${includeMediaInBackup ? '-full' : ''}.ilm`;
      const chosenPath = await window.api.chooseBackupSavePath(defaultName);

      if (!chosenPath) return;

      setIsBackingUp(true);
      const res = await window.api.createBackup({
        includeMedia: includeMediaInBackup,
        destinationPath: chosenPath,
      });
      setLastBackupResult(res);

      if (res.success) {
        toast({
          title: 'Backup Created!',
          description: `Saved to ${res.filePath}`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Backup Failed',
          description: res.error || 'Unknown error',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (e: any) {
      toast({
        title: 'Backup Error',
        description: e?.message || 'Failed to create backup',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleChooseRestoreFile = async () => {
    try {
      const chosenPath = await window.api.chooseBackupOpenPath();
      if (!chosenPath) return;

      const inspected = await window.api.inspectBackup(chosenPath);
      if (inspected.success) {
        setInspectResult(inspected);
      } else {
        toast({
          title: 'Cannot Read Backup',
          description: inspected.error || 'Invalid backup archive format',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error opening backup',
        description: e?.message || 'Could not inspect file',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleExecuteRestore = async () => {
    if (!inspectResult || !inspectResult.filePath) return;

    try {
      setIsRestoring(true);
      const res = await window.api.restoreBackup({
        filePath: inspectResult.filePath,
        mode: restoreMode,
      });
      setLastRestoreResult(res);

      if (res.success) {
        toast({
          title: 'Restore Completed Successfully!',
          description: `Recovered ${res.restoredCounts?.lectures || 0} lectures, ${res.restoredCounts?.notes || 0} notes. Reloading library...`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });

        // Delay slightly and reload so the entire app picks up the new database state cleanly
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast({
          title: 'Restore Failed',
          description: res.error || 'Failed to restore archive',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (e: any) {
      toast({
        title: 'Restore Error',
        description: e?.message || 'Failed to complete restore',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsRestoring(false);
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
                  <Icon as={FiDatabase} boxSize={3.5} />
                  <Text>Backup & Restore</Text>
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

              {/* Tab 5: Backup & Restore */}
              <TabPanel px={1} py={2}>
                <VStack spacing={5} align="stretch">
                  {/* Create Backup */}
                  <Box p={4} bg={sectionBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={2}>
                        <Icon as={FiDownload} color="green.400" boxSize={4} />
                        <Heading size="xs">Create Library Backup</Heading>
                      </HStack>
                      <Badge colorScheme="green">Portable (.ilm)</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mb={3} lineHeight="tall">
                      Export your study library, series, lectures, notes, tags, bookmarks, and PDF comments into a single compressed backup file.
                    </Text>

                    <HStack justify="space-between" p={3} bg="blackAlpha.200" borderRadius="md" mb={4}>
                      <VStack align="start" spacing={0.5}>
                        <Text fontSize="xs" fontWeight="semibold">Include Audio & PDF Files</Text>
                        <Text fontSize="2xs" color="gray.400">
                          {includeMediaInBackup
                            ? 'Full Archive: Bundles all internal audio lectures and textbook PDFs'
                            : 'Lightweight: Study records & notes only (fast & compact)'}
                        </Text>
                      </VStack>
                      <Switch
                        colorScheme="green"
                        isChecked={includeMediaInBackup}
                        onChange={(e) => setIncludeMediaInBackup(e.target.checked)}
                      />
                    </HStack>

                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FiDownload />}
                      isLoading={isBackingUp}
                      loadingText="Creating backup..."
                      onClick={handleCreateBackup}
                    >
                      Export Backup (.ilm)
                    </Button>

                    {lastBackupResult && lastBackupResult.success && (
                      <Box mt={3} p={2.5} bg="rgba(16, 185, 129, 0.12)" borderRadius="md" border="1px solid" borderColor="green.700">
                        <HStack spacing={2} mb={1}>
                          <Icon as={FiCheckCircle} color="green.400" boxSize={3.5} />
                          <Text fontSize="xs" fontWeight="semibold" color="green.300">Backup successfully saved</Text>
                        </HStack>
                        <Text fontSize="2xs" color="gray.300" noOfLines={1} fontFamily="mono">
                          {lastBackupResult.filePath}
                        </Text>
                        {lastBackupResult.fileSizeBytes && (
                          <Text fontSize="2xs" color="gray.400" mt={0.5}>
                            Size: {(lastBackupResult.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {lastBackupResult.manifest?.counts.lectures || 0} lectures, {lastBackupResult.manifest?.counts.notes || 0} notes, {lastBackupResult.manifest?.counts.pdfComments || 0} PDF comments
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Restore from Backup */}
                  <Box p={4} bg={sectionBg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={2}>
                        <Icon as={FiUpload} color="blue.400" boxSize={4} />
                        <Heading size="xs">Restore from Backup</Heading>
                      </HStack>
                      <Badge colorScheme="blue">Import (.ilm / .zip)</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mb={3} lineHeight="tall">
                      Import an existing Ilm Studio backup archive to restore or merge your courses and notes.
                    </Text>

                    {!inspectResult ? (
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<FiFolder />}
                        onClick={handleChooseRestoreFile}
                      >
                        Select Backup File...
                      </Button>
                    ) : (
                      <VStack spacing={3} align="stretch" mt={2}>
                        {/* Inspection Summary Card */}
                        <Box p={3} bg="blackAlpha.300" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100">
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="xs" fontWeight="bold" color="blue.300">
                              Archive Verified
                            </Text>
                            <Button size="2xs" variant="ghost" onClick={() => setInspectResult(null)}>
                              Change File
                            </Button>
                          </HStack>
                          <Text fontSize="2xs" color="gray.400" noOfLines={1} mb={2} fontFamily="mono">
                            {inspectResult.filePath}
                          </Text>
                          {inspectResult.manifest && (
                            <HStack spacing={3} wrap="wrap" fontSize="2xs" color="gray.300">
                              <Text>📅 {new Date(inspectResult.manifest.createdAt).toLocaleDateString()}</Text>
                              <Text>📚 {inspectResult.manifest.counts.series || 0} Series</Text>
                              <Text>🎙️ {inspectResult.manifest.counts.lectures || 0} Lectures</Text>
                              <Text>📝 {inspectResult.manifest.counts.notes || 0} Notes</Text>
                              <Text>✍️ {inspectResult.manifest.counts.pdfComments || 0} Comments</Text>
                              <Badge colorScheme={inspectResult.manifest.hasMedia ? 'green' : 'gray'} fontSize="3xs">
                                {inspectResult.manifest.hasMedia ? 'Includes Media' : 'Notes Only'}
                              </Badge>
                            </HStack>
                          )}
                        </Box>

                        {/* Mode Choice */}
                        <FormControl>
                          <FormLabel fontSize="xs" fontWeight="semibold">Restore Action</FormLabel>
                          <Select
                            size="sm"
                            value={restoreMode}
                            onChange={(e) => setRestoreMode(e.target.value as any)}
                          >
                            <option value="merge">Merge with current library (Safe, preserves existing items)</option>
                            <option value="clean">Clean Replace (Wipe and replace with this backup)</option>
                          </Select>
                        </FormControl>

                        {restoreMode === 'clean' && (
                          <HStack p={2} bg="rgba(239, 68, 68, 0.12)" borderRadius="md" border="1px solid" borderColor="red.700" spacing={2}>
                            <Icon as={FiAlertTriangle} color="red.400" boxSize={4} />
                            <Text fontSize="2xs" color="red.200">
                              A recovery snapshot of your current library will be created automatically before replacing.
                            </Text>
                          </HStack>
                        )}

                        <HStack spacing={2} pt={1}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<FiRefreshCw />}
                            isLoading={isRestoring}
                            loadingText="Restoring library..."
                            onClick={handleExecuteRestore}
                          >
                            Confirm & Restore
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setInspectResult(null)} isDisabled={isRestoring}>
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    )}

                    {lastRestoreResult && lastRestoreResult.success && (
                      <Box mt={3} p={2.5} bg="rgba(16, 185, 129, 0.12)" borderRadius="md" border="1px solid" borderColor="green.700">
                        <HStack spacing={2} mb={1}>
                          <Icon as={FiCheckCircle} color="green.400" boxSize={3.5} />
                          <Text fontSize="xs" fontWeight="semibold" color="green.300">Library successfully restored</Text>
                        </HStack>
                        <Text fontSize="2xs" color="gray.300">
                          {lastRestoreResult.restoredCounts?.lectures || 0} lectures, {lastRestoreResult.restoredCounts?.notes || 0} notes, and {lastRestoreResult.restoredCounts?.pdfComments || 0} comments restored. App will reload to apply changes.
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Safety Snapshots Note */}
                  <Box p={3} bg={sectionBg} borderRadius="lg" border="1px dashed" borderColor="whiteAlpha.200">
                    <HStack spacing={2}>
                      <Icon as={FiArchive} color="yellow.400" boxSize={4} />
                      <Text fontSize="xs" fontWeight="semibold">Recovery Snapshots</Text>
                    </HStack>
                    <Text fontSize="2xs" color="gray.400" mt={1}>
                      Every time you restore a backup, Ilm Studio automatically saves a rollback recovery snapshot into your <code>backups/</code> folder inside your data directory so you never lose any learning progress.
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab 6: About */}
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
