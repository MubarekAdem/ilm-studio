import { create } from 'zustand';
import type { Series, Lecture } from '../../shared/types';

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

  // Loading
  isLoadingSeries: boolean;
  isLoadingLectures: boolean;

  // Actions
  setView: (view: AppView) => void;
  selectSeries: (seriesId: string | null) => void;
  selectLecture: (lectureId: string | null) => void;
  setCurrentPdfPage: (page: number) => void;
  jumpToPdfPage: (page: number) => void;
  loadSeries: () => Promise<void>;
  loadLectures: (seriesId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentView: 'library',
  selectedSeriesId: null,
  selectedLectureId: null,
  currentPdfPage: 1,
  targetPdfPage: null,
  seriesList: [],
  lectures: [],
  lecturesList: [],
  isLoadingSeries: false,
  isLoadingLectures: false,

  // Actions
  setView: (view) => set({ currentView: view }),

  selectSeries: (seriesId) =>
    set({ selectedSeriesId: seriesId, selectedLectureId: null, lectures: [], lecturesList: [] }),

  selectLecture: (lectureId) => set({ selectedLectureId: lectureId }),

  setCurrentPdfPage: (page) => set({ currentPdfPage: page }),

  jumpToPdfPage: (page) => set({ targetPdfPage: page }),

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

  loadLectures: async (seriesId: string) => {
    set({ isLoadingLectures: true });
    try {
      const lectures = await window.api.getLectures(seriesId);
      set({ lectures, lecturesList: lectures, isLoadingLectures: false });
    } catch (error) {
      console.error('Failed to load lectures:', error);
      set({ isLoadingLectures: false });
    }
  },
}));
