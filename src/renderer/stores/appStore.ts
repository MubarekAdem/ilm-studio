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
  setView: (view) => {
    try {
      localStorage.setItem('ilm_last_view', view);
    } catch {}
    set({ currentView: view });
  },

  selectSeries: (seriesId) => {
    set({ selectedSeriesId: seriesId });
    if (seriesId) {
      try {
        localStorage.setItem('ilm_last_played_series_id', seriesId);
      } catch {}
    }
    get().loadLectures(seriesId || undefined).then(() => {
      const lecs = get().lecturesList;
      if (lecs.length > 0) {
        // 1. Check if the currently selected lecture belongs to this series
        const curId = get().selectedLectureId;
        const existing = curId ? lecs.find((l) => l.id === curId) : null;
        if (existing) {
          get().selectLecture(existing.id);
          return;
        }

        // 2. Check if a last played lecture for this specific series was recorded
        const lastSeriesLecId = seriesId ? localStorage.getItem(`ilm_last_played_lecture_${seriesId}`) : null;
        const lastPlayedLec = lastSeriesLecId ? lecs.find((l) => l.id === lastSeriesLecId) : null;
        if (lastPlayedLec) {
          get().selectLecture(lastPlayedLec.id);
          return;
        }

        // 3. Find in-progress lecture (partially listened: lastPosition > 0 and completionPct < 95)
        const inProgressLec = lecs.find((l) => (l.lastPosition > 0 || l.completionPct > 0) && l.completionPct < 95);
        if (inProgressLec) {
          get().selectLecture(inProgressLec.id);
          return;
        }

        // 4. Prefer a lecture that has audio, otherwise fall back to first lecture
        const bestLecture = lecs.find((l) => Boolean(l.audioPath)) || lecs[0];
        get().selectLecture(bestLecture.id);
      } else {
        set({ selectedLectureId: null, currentLecture: null });
      }
    }).catch(console.error);
  },

  selectLecture: (lectureId) => {
    set({ selectedLectureId: lectureId });
    if (lectureId) {
      try {
        localStorage.setItem('ilm_last_played_lecture_id', lectureId);
      } catch {}
      window.api.getLecture(lectureId).then((lec) => {
        if (lec) {
          const savedPosStr = localStorage.getItem(`ilm_last_audio_pos_${lec.id}`);
          const pos = savedPosStr ? parseFloat(savedPosStr) : (lec.lastPosition || 0);
          const enrichedLec = { ...lec, lastPosition: pos };
          set((state) => ({
            currentLecture: enrichedLec,
            lectures: state.lectures.map((l) => (l.id === lec.id ? enrichedLec : l)),
            lecturesList: state.lecturesList.map((l) => (l.id === lec.id ? enrichedLec : l)),
          }));
          const curPlayerLec = usePlayerStore.getState().currentLecture;
          if (!curPlayerLec || curPlayerLec.id !== lec.id) {
            usePlayerStore.setState({
              currentLecture: enrichedLec,
              currentTime: pos,
            });
          }
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
