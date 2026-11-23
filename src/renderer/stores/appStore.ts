import { create } from 'zustand';
import type { Series, Lecture } from '../../shared/types';
import { usePlayerStore } from './playerStore';

export type AppView = 'library' | 'study' | 'dashboard';

interface AppState {
  // Navigation
  currentView: AppView;

  // Selection
  selectedSeriesId: string | null;
  selectedLectureId: string | null;

  // PDF navigation
  currentPdfPage: number;
  targetPdfPage: number | null;

  // Data
  seriesList: Series[];
  lectures: Lecture[];
  lecturesList: Lecture[];
  currentLecture: Lecture | null;

  // Global Modals
  isSearchOpen: boolean;
  isQuranOpen: boolean;
  isSettingsOpen: boolean;
  isTagManagerOpen: boolean;
  isImportOpen: boolean;
  importInitialTab: 'audio' | 'pdf';
  importInitialSeriesId: string | null;

  // Tag Filtering
  selectedTagFilter: string | null;

  // Loading
  isLoadingSeries: boolean;
  isLoadingLectures: boolean;

  // Workspace & Zen Mode
  isFocusMode: boolean;
  pdfSplitRatio: number; // percentage width of PDF pane (default 55)
  quotedPdfText: { text: string; page: number } | null;

  // Actions
  setView: (view: AppView) => void;
  selectSeries: (seriesId: string | null) => void;
  selectLecture: (lectureId: string | null) => void;
  setCurrentPdfPage: (page: number) => void;
  jumpToPdfPage: (page: number) => void;
  setSearchOpen: (open: boolean) => void;
  setQuranOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTagManagerOpen: (open: boolean) => void;
  openImport: (options?: { tab?: 'audio' | 'pdf'; seriesId?: string | null }) => void;
  closeImport: () => void;
  setSelectedTagFilter: (tagId: string | null) => void;
  setFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
  setPdfSplitRatio: (ratio: number) => void;
  setQuotedPdfText: (quote: { text: string; page: number } | null) => void;
  loadSeries: () => Promise<void>;
  loadLectures: (seriesId?: string) => Promise<void>;
  refreshCurrentLecture: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentView: 'library',
  selectedSeriesId: null,
  selectedLectureId: null,
  currentLecture: null,
  currentPdfPage: 1,
  targetPdfPage: null,
  seriesList: [],
  lectures: [],
  lecturesList: [],
  isSearchOpen: false,
  isQuranOpen: false,
  isSettingsOpen: false,
  isTagManagerOpen: false,
  isImportOpen: false,
  importInitialTab: 'audio',
  importInitialSeriesId: null,
  selectedTagFilter: null,
  isFocusMode: false,
  pdfSplitRatio: 55,
  quotedPdfText: null,
  isLoadingSeries: false,
  isLoadingLectures: false,

  // Actions
  setView: (view) => set({ currentView: view }),

  selectSeries: (seriesId) => {
    set({ selectedSeriesId: seriesId });
    get().loadLectures(seriesId || undefined).then(() => {
      const lecs = get().lecturesList;
      if (lecs.length > 0) {
        const curId = get().selectedLectureId;
        const existing = curId ? lecs.find((l) => l.id === curId) : null;
        if (existing) {
          get().selectLecture(existing.id);
          usePlayerStore.setState({ currentLecture: existing });
          return;
        }
        // Prefer a lecture that has audio, otherwise fall back to first lecture
        const bestLecture = lecs.find((l) => Boolean(l.audioPath)) || lecs[0];
        get().selectLecture(bestLecture.id);
        usePlayerStore.setState({ currentLecture: bestLecture });
      } else {
        set({ selectedLectureId: null, currentLecture: null });
      }
    }).catch(console.error);
  },

  selectLecture: (lectureId) => {
    set({ selectedLectureId: lectureId });
    if (lectureId) {
      window.api.getLecture(lectureId).then((lec) => {
        if (lec) {
          set((state) => ({
            currentLecture: lec,
            lectures: state.lectures.map((l) => (l.id === lec.id ? lec : l)),
            lecturesList: state.lecturesList.map((l) => (l.id === lec.id ? lec : l)),
          }));
        }
      }).catch(console.error);
    } else {
      set({ currentLecture: null });
    }
  },

  refreshCurrentLecture: async () => {
    const id = get().selectedLectureId;
    if (!id) return;
    try {
      const lec = await window.api.getLecture(id);
      if (lec) {
        set((state) => ({
          currentLecture: lec,
          lectures: state.lectures.map((l) => (l.id === lec.id ? lec : l)),
          lecturesList: state.lecturesList.map((l) => (l.id === lec.id ? lec : l)),
        }));
      }
    } catch (err) {
      console.error('Failed to refresh current lecture:', err);
    }
  },

  setCurrentPdfPage: (page) => set({ currentPdfPage: page }),

  jumpToPdfPage: (page) => set({ targetPdfPage: page }),

  setSearchOpen: (open) => set({ isSearchOpen: open }),

  setQuranOpen: (open) => set({ isQuranOpen: open }),

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  setTagManagerOpen: (open) => set({ isTagManagerOpen: open }),

  openImport: (options) =>
    set({
      isImportOpen: true,
      importInitialTab: options?.tab || 'audio',
      importInitialSeriesId: options?.seriesId ?? get().selectedSeriesId,
    }),

  closeImport: () => set({ isImportOpen: false }),

  setSelectedTagFilter: (tagId) => set({ selectedTagFilter: tagId }),

  setFocusMode: (focus) => set({ isFocusMode: focus }),

  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),

  setPdfSplitRatio: (ratio) => set({ pdfSplitRatio: Math.max(25, Math.min(75, ratio)) }),

  setQuotedPdfText: (quote) => set({ quotedPdfText: quote }),

  loadSeries: async () => {
    set({ isLoadingSeries: true });
    try {
      const series = await window.api.getAllSeries();
      set({ seriesList: series, isLoadingSeries: false });
    } catch (error) {
      console.error('Failed to load series:', error);
      set({ isLoadingSeries: false });
    }
  },

  loadLectures: async (seriesId?: string) => {
    set({ isLoadingLectures: true });
    try {
      const lectures = await window.api.getLectures(seriesId);
      set({ lectures, lecturesList: lectures, isLoadingLectures: false });
      const currentId = get().selectedLectureId;
      if (currentId) {
        const found = lectures.find((l) => l.id === currentId);
        if (found) set({ currentLecture: found });
      }
    } catch (error) {
      console.error('Failed to load lectures:', error);
      set({ isLoadingLectures: false });
    }
  },
}));
