import React, { useEffect } from 'react';
import { Flex } from '@chakra-ui/react';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';
import { GlobalSearchModal } from './components/Search/GlobalSearchModal';
import { QuranLookupModal } from './components/Quran/QuranLookupModal';
import { useAppStore } from './stores/appStore';

const App: React.FC = () => {
  const isSearchOpen = useAppStore((s) => s.isSearchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const isQuranOpen = useAppStore((s) => s.isQuranOpen);
  const setQuranOpen = useAppStore((s) => s.setQuranOpen);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K for Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      // Ctrl+Q / Cmd+Q for Quran Lookup
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setQuranOpen(!isQuranOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isQuranOpen, setSearchOpen, setQuranOpen]);

  return (
    <Flex direction="column" h="100vh" w="100vw" overflow="hidden">
      {/* Main workspace: Sidebar + Main Content */}
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <MainContent />
      </Flex>

      {/* Audio player pinned to the bottom */}
      <AudioPlayer />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <QuranLookupModal
        isOpen={isQuranOpen}
        onClose={() => setQuranOpen(false)}
      />
    </Flex>
  );
};

export default App;
