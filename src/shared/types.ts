// Shared type definitions for Ilm Studio

export interface Series {
  id: string;
  title: string;
  scholar: string;
  topic: string;
  description: string;
  totalLectures: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lecture {
  id: string;
  seriesId: string | null;
  title: string;
  orderIndex: number;
  audioPath: string | null;
  pdfPath: string | null;
  isCopied: boolean;
  duration: number; // seconds
  lastPosition: number; // seconds
  completionPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  lectureId: string;
  content: string; // TipTap JSON
  audioTimestamp: number | null; // seconds
  pdfPage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  category: 'topic' | 'scholar' | 'book' | 'custom';
}

export interface NoteTag {
  noteId: string;
  tagId: string;
}

export interface Bookmark {
  id: string;
  lectureId: string;
  type: 'audio' | 'pdf';
  position: number; // seconds for audio, page for pdf
  label: string;
  note: string;
  createdAt: string;
}

export type PdfCommentColor = 'amber' | 'emerald' | 'sky' | 'rose' | 'violet';
export type PdfCommentFontStyle = 'handwriting' | 'sans';

export interface PdfComment {
  id: string;
  pdfPath: string;
  lectureId: string | null;
  page: number;
  xPct: number;
  yPct: number;
  content: string;
  color: PdfCommentColor;
  fontStyle: PdfCommentFontStyle;
  drawingData?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  lectureId: string;
  startTime: number; // seconds
  title: string;
  createdAt: string;
}

export interface Surah {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_english: string;
  revelation_place: string;
  verses_count: number;
}

export interface Ayah {
  id: number;
  surah_id: number;
  ayah_number: number;
  verse_key: string; // e.g. "2:255"
  text_uthmani: string;
  translation_en: string;
  surah_name_arabic?: string;
  surah_name_simple?: string;
  surah_name_english?: string;
}

export interface LibrarySearchResult {
  type: 'series' | 'lecture' | 'note';
  id: string;
  title: string;
  snippet: string;
  seriesId?: string;
  lectureId?: string;
}

export interface StudySession {
  id: string;
  lectureId: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
}

export interface ReviewSchedule {
  id: string;
  lectureId: string;
  nextReviewDate: string;
  intervalDays: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  playbackSpeed: number;
  dailyGoalMinutes: number;
  defaultImportMode: 'copy' | 'reference' | 'ask';
  fontSize: number;
  arabicFontSize: number;
  launchReminderEnabled: boolean;
  chromeReminderEnabled: boolean;
  minimizeToTrayEnabled: boolean;
  reminderIntervalHours: number;
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Tags
  DB_GET_ALL_TAGS: 'db:get-all-tags',
  DB_CREATE_TAG: 'db:create-tag',
  DB_DELETE_TAG: 'db:delete-tag',
  DB_GET_NOTE_TAGS: 'db:get-note-tags',
  DB_ADD_NOTE_TAG: 'db:add-note-tag',
  DB_REMOVE_NOTE_TAG: 'db:remove-note-tag',

  // Database
  DB_GET_ALL_SERIES: 'db:get-all-series',
  DB_CREATE_SERIES: 'db:create-series',
  DB_UPDATE_SERIES: 'db:update-series',
  DB_DELETE_SERIES: 'db:delete-series',
  DB_GET_LECTURES: 'db:get-lectures',
  DB_GET_LECTURE: 'db:get-lecture',
  DB_CREATE_LECTURE: 'db:create-lecture',
  DB_UPDATE_LECTURE: 'db:update-lecture',
  DB_DELETE_LECTURE: 'db:delete-lecture',
  DB_GET_NOTES: 'db:get-notes',
  DB_CREATE_NOTE: 'db:create-note',
  DB_UPDATE_NOTE: 'db:update-note',
  DB_DELETE_NOTE: 'db:delete-note',
  DB_GET_BOOKMARKS: 'db:get-bookmarks',
  DB_CREATE_BOOKMARK: 'db:create-bookmark',
  DB_DELETE_BOOKMARK: 'db:delete-bookmark',
  DB_GET_PDF_COMMENTS: 'db:get-pdf-comments',
  DB_CREATE_PDF_COMMENT: 'db:create-pdf-comment',
  DB_UPDATE_PDF_COMMENT: 'db:update-pdf-comment',
  DB_DELETE_PDF_COMMENT: 'db:delete-pdf-comment',
  DB_GET_CHAPTERS: 'db:get-chapters',
  DB_CREATE_CHAPTER: 'db:create-chapter',
  DB_DELETE_CHAPTER: 'db:delete-chapter',
  DB_LOG_SESSION: 'db:log-session',
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_GET_SETTINGS: 'db:get-settings',
  DB_UPDATE_SETTING: 'db:update-setting',
  DB_GET_STATS: 'db:get-stats',
  DB_SEARCH_LIBRARY: 'db:search-library',
  DB_GET_DUE_REVIEWS: 'db:get-due-reviews',
  DB_UPDATE_REVIEW_SCHEDULE: 'db:update-review-schedule',
  DB_GET_WEEKLY_BREAKDOWN: 'db:get-weekly-breakdown',
  DB_GET_SERIES_PACING: 'db:get-series-pacing',

  // Quran
  QURAN_GET_SURAHS: 'quran:get-surahs',
  QURAN_GET_AYAH: 'quran:get-ayah',
  QURAN_SEARCH: 'quran:search',

  // File operations
  FILE_IMPORT_AUDIO: 'file:import-audio',
  FILE_IMPORT_PDF: 'file:import-pdf',
  FILE_GET_AUDIO_METADATA: 'file:get-audio-metadata',
  FILE_OPEN_DIALOG: 'file:open-dialog',
  FILE_READ_BUFFER: 'file:read-buffer',

  // App
  APP_GET_DATA_PATH: 'app:get-data-path',

  // Backup & Restore
  BACKUP_CREATE: 'backup:create',
  BACKUP_INSPECT: 'backup:inspect',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_CHOOSE_SAVE_PATH: 'backup:choose-save-path',
  BACKUP_CHOOSE_OPEN_PATH: 'backup:choose-open-path',
} as const;

export interface BackupManifest {
  version: number;
  appName: string;
  appVersion: string;
  createdAt: string;
  hasMedia: boolean;
  counts: {
    series: number;
    lectures: number;
    notes: number;
    tags: number;
    bookmarks: number;
    pdfComments: number;
    chapters: number;
    sessions: number;
  };
}

export interface BackupCreateOptions {
  includeMedia: boolean;
  destinationPath?: string;
}

export interface BackupCreateResult {
  success: boolean;
  filePath?: string;
  fileSizeBytes?: number;
  manifest?: BackupManifest;
  error?: string;
}

export interface BackupInspectResult {
  success: boolean;
  filePath: string;
  manifest?: BackupManifest;
  error?: string;
}

export interface BackupRestoreOptions {
  filePath: string;
  mode: 'merge' | 'clean';
}

export interface BackupRestoreResult {
  success: boolean;
  safetySnapshotPath?: string;
  restoredCounts?: {
    series: number;
    lectures: number;
    notes: number;
    pdfComments: number;
  };
  error?: string;
}

export interface DailyStudyBreakdown {
  date: string;
  dayLabel: string;
  minutes: number;
}

export interface DueReviewItem {
  id: string;
  lectureId: string;
  lectureTitle: string;
  seriesTitle?: string;
  nextReviewDate: string;
  intervalDays: number;
  isDue: boolean;
}

export interface SeriesPacingInfo {
  seriesId: string;
  title: string;
  scholar: string;
  topic: string;
  totalLectures: number;
  completedLectures: number;
  completionPct: number;
  targetPerWeek: number;
  nextLecture?: {
    id: string;
    title: string;
    audioPath: string | null;
    pdfPath: string | null;
  };
}

// Stats for dashboard
export interface StudyStats {
  totalSeries: number;
  totalLectures: number;
  completedLectures: number;
  totalStudyTimeMinutes: number;
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  weekMinutes: number;
  recentSessions: StudySession[];
  weeklyBreakdown?: DailyStudyBreakdown[];
}

export interface ImportAudioOptions {
  filePath: string;
  title: string;
  seriesId: string | null;
  copyToLibrary: boolean;
}

export interface ImportPdfOptions {
  filePath: string;
  lectureId: string | null;
  copyToLibrary: boolean;
}

export interface OpenDialogFilter {
  name: string;
  extensions: string[];
}

export interface OpenDialogOptions {
  filters?: OpenDialogFilter[];
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | string)[];
}
