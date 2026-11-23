import React, { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { usePlayerStore } from '../stores/playerStore';

export function useKeyboardShortcuts() {
  const isSearchOpen = useAppStore((s) => s.isSearchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const isQuranOpen = useAppStore((s) => s.isQuranOpen);
  const setQuranOpen = useAppStore((s) => s.setQuranOpen);
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const currentLecture = usePlayerStore((s) => s.currentLecture);
  const addBookmark = usePlayerStore((s) => s.addBookmark);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true' ||
        activeEl?.classList.contains('tiptap') ||
        activeEl?.classList.contains('ProseMirror');

      // ── Modals / Overlays ──
      // Ctrl+K / Cmd+K: Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
        return;
      }

      // Ctrl+Q / Cmd+Q: Quran
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setQuranOpen(!isQuranOpen);
        return;
      }

      // Ctrl+,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(!isSettingsOpen);
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z: Toggle Zen Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // Escape: close topmost modal
      if (e.key === 'Escape') {
        if (isSearchOpen) setSearchOpen(false);
        if (isQuranOpen) setQuranOpen(false);
        if (isSettingsOpen) setSettingsOpen(false);
        return;
      }

      // ── Playback Controls (only when not typing in text fields) ──
      if (isInputFocused) return;

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else if (currentLecture) {
          play();
        }
        return;
      }

      // Left Arrow: Seek back 10s
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 10));
        return;
      }

      // Right Arrow: Seek forward 10s
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 10));
        return;
      }

      // 'b' key: Quick bookmark
      if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey && currentLecture) {
        e.preventDefault();
        const mins = Math.floor(currentTime / 60);
        const secs = Math.floor(currentTime % 60).toString().padStart(2, '0');
        addBookmark(`Bookmark at ${mins}:${secs}`);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOpen,
    isQuranOpen,
    isSettingsOpen,
    isPlaying,
    currentTime,
    duration,
    currentLecture,
    setSearchOpen,
    setQuranOpen,
    setSettingsOpen,
    play,
    pause,
    seek,
    addBookmark,
  ]);
}

export default useKeyboardShortcuts;
