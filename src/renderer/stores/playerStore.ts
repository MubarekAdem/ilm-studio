import { create } from 'zustand';
import type { Lecture, Bookmark, Chapter } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export type EqPreset = 'normal' | 'clarity' | 'cassette' | 'bass';

interface PlayerState {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: number;

  // A-B Loop repeat
  loopA: number | null;
  loopB: number | null;
  isLooping: boolean;

  // Silence skip
  skipSilence: boolean;

  // Equalizer preset
  eqPreset: EqPreset;

  // Current lecture
  currentLecture: Lecture | null;

  // Bookmarks & Chapters for current lecture
  bookmarks: Bookmark[];
  chapters: Chapter[];
  currentChapter: Chapter | null;

  // Actions
  play: (lecture?: Lecture) => void;
  pause: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;

  // A-B Loop actions
  setLoopA: (time: number | null) => void;
  setLoopB: (time: number | null) => void;
  toggleLoop: () => void;
  clearLoop: () => void;

  // Silence skip & EQ
  setSkipSilence: (skip: boolean) => void;
  setEqPreset: (preset: EqPreset) => void;

  // Bookmark actions
  addBookmark: (label: string, note?: string) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  loadBookmarks: (lectureId: string) => Promise<void>;

  // Chapter actions
  loadChapters: (lectureId: string) => Promise<void>;
  addChapter: (title: string, startTime: number) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  updateCurrentChapter: (currentTime: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackSpeed: 1,

  // A-B Loop
  loopA: null,
  loopB: null,
  isLooping: false,

  // Silence skip & EQ
  skipSilence: false,
  eqPreset: 'normal',

  currentLecture: null,
  bookmarks: [],
  chapters: [],
  currentChapter: null,

  // Actions
  play: (lecture) => {
    if (lecture) {
      set({
        currentLecture: lecture,
        isPlaying: true,
        currentTime: lecture.lastPosition || 0,
        loopA: null,
        loopB: null,
        isLooping: false,
      });
    } else {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  seek: (time) => set({ currentTime: Math.max(0, time) }),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setCurrentTime: (time) => {
    set({ currentTime: time });
    get().updateCurrentChapter(time);
  },

  setDuration: (duration) => set({ duration }),

  // A-B Loop actions
  setLoopA: (time) => set({ loopA: time }),
  setLoopB: (time) => {
    set({ loopB: time, isLooping: time !== null && get().loopA !== null });
  },
  toggleLoop: () => {
    const { loopA, loopB, isLooping } = get();
    if (loopA !== null && loopB !== null) {
      set({ isLooping: !isLooping });
    }
  },
  clearLoop: () => set({ loopA: null, loopB: null, isLooping: false }),

  // Silence skip & EQ
  setSkipSilence: (skip) => set({ skipSilence: skip }),
  setEqPreset: (preset) => set({ eqPreset: preset }),

  // Bookmarks
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

  // Chapters
  loadChapters: async (lectureId) => {
    try {
      const chapters = await window.api.getChapters(lectureId);
      set({ chapters });
      get().updateCurrentChapter(get().currentTime);
    } catch (error) {
      console.error('Failed to load chapters:', error);
      set({ chapters: [], currentChapter: null });
    }
  },

  addChapter: async (title, startTime) => {
    const { currentLecture } = get();
    if (!currentLecture) return;

    try {
      const newChapter = await window.api.createChapter({
        lectureId: currentLecture.id,
        startTime,
        title,
      });
      const updated = [...get().chapters, newChapter].sort((a, b) => a.startTime - b.startTime);
      set({ chapters: updated });
      get().updateCurrentChapter(get().currentTime);
    } catch (error) {
      console.error('Failed to add chapter:', error);
    }
  },

  deleteChapter: async (chapterId) => {
    try {
      await window.api.deleteChapter(chapterId);
      const updated = get().chapters.filter((c) => c.id !== chapterId);
      set({ chapters: updated });
      get().updateCurrentChapter(get().currentTime);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  },

  updateCurrentChapter: (currentTime: number) => {
    const { chapters } = get();
    if (!chapters || chapters.length === 0) {
      set({ currentChapter: null });
      return;
    }
    // Find chapter where startTime <= currentTime
    let active: Chapter | null = null;
    for (const ch of chapters) {
      if (ch.startTime <= currentTime) {
        active = ch;
      } else {
        break;
      }
    }
    set({ currentChapter: active });
  },
}));
