import React, { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';
import { GlobalSearchModal } from './components/Search/GlobalSearchModal';
import { QuranLookupModal } from './components/Quran/QuranLookupModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TagManager } from './components/Tags/TagManager';
import { ImportDialog } from './components/Library/ImportDialog';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAppStore } from './stores/appStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const isSearchOpen = useAppStore((s) => s.isSearchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const isQuranOpen = useAppStore((s) => s.isQuranOpen);
  const setQuranOpen = useAppStore((s) => s.setQuranOpen);
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const isTagManagerOpen = useAppStore((s) => s.isTagManagerOpen);
  const setTagManagerOpen = useAppStore((s) => s.setTagManagerOpen);

  // Activate all global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <Flex direction="column" h="100vh" w="100vw" overflow="hidden">
        {/* Main workspace: Sidebar + Main Content */}
        <Flex flex="1" overflow="hidden">
          <ErrorBoundary fallbackTitle="Sidebar Error">
            <Sidebar />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="Content Error">
            <MainContent />
          </ErrorBoundary>
        </Flex>

        {/* Audio player pinned to the bottom */}
        <ErrorBoundary fallbackTitle="Audio Engine Error">
          <AudioPlayer />
        </ErrorBoundary>

        {/* Global Modals */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setSearchOpen(false)}
        />
        <QuranLookupModal
          isOpen={isQuranOpen}
          onClose={() => setQuranOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <TagManager
          isOpen={isTagManagerOpen}
          onClose={() => setTagManagerOpen(false)}
        />
        <ImportDialog />
      </Flex>
    </ErrorBoundary>
  );
};

export default App;
