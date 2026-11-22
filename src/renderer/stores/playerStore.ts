import { create } from 'zustand';
import type { Lecture, Bookmark } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface PlayerState {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: number;

  // Current lecture
  currentLecture: Lecture | null;

  // Bookmarks for current lecture
  bookmarks: Bookmark[];

  // Actions
  play: (lecture?: Lecture) => void;
  pause: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  addBookmark: (label: string, note?: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  loadBookmarks: (lectureId: string) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,
  currentLecture: null,
  bookmarks: [],

  // Actions
  play: (lecture) => {
    if (lecture) {
      set({
        currentLecture: lecture,
        isPlaying: true,
        currentTime: lecture.lastPosition || 0,
      });
    } else {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  seek: (time) => set({ currentTime: Math.max(0, time) }),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  addBookmark: async (label, note = '') => {
    const { currentLecture, currentTime } = get();
    if (!currentLecture) return;

    const bookmark: Bookmark = {
      id: uuidv4(),
      lectureId: currentLecture.id,
      type: 'audio',
      position: currentTime,
      label,
      note,
      createdAt: new Date().toISOString(),
    };

    try {
      await window.api.createBookmark(bookmark);
      set((state) => ({ bookmarks: [...state.bookmarks, bookmark] }));
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    }
  },

  removeBookmark: async (bookmarkId) => {
    try {
      await window.api.deleteBookmark(bookmarkId);
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== bookmarkId),
      }));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  },

  loadBookmarks: async (lectureId) => {
    try {
      const bookmarks = await window.api.getBookmarks(lectureId);
      set({ bookmarks });
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      set({ bookmarks: [] });
    }
  },
}));
