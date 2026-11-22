import React from 'react';
import { Flex } from '@chakra-ui/react';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import { AudioPlayer } from './components/AudioPlayer/AudioPlayer';

const App: React.FC = () => {
  return (
    <Flex direction="column" h="100vh" w="100vw" overflow="hidden">
      {/* Main workspace: Sidebar + Main Content */}
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <MainContent />
      </Flex>

      {/* Audio player pinned to the bottom */}
      <AudioPlayer />
    </Flex>
  );
};

export default App;
