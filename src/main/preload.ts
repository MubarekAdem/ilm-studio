import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  Series,
  Lecture,
  Note,
  Tag,
  Bookmark,
  PdfComment,
  Chapter,
  StudySession,
  ReviewSchedule,
  AppSettings,
  StudyStats,
  Surah,
  Ayah,
  LibrarySearchResult,
  DailyStudyBreakdown,
  DueReviewItem,
  SeriesPacingInfo,
  ImportAudioOptions,
  ImportPdfOptions,
  OpenDialogOptions,
  BackupCreateOptions,
  BackupCreateResult,
  BackupInspectResult,
  BackupRestoreOptions,
  BackupRestoreResult,
} from '../shared/types';

const api = {
  // ── Series ──────────────────────────────────────────────────────────
  getAllSeries: (): Promise<Series[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_ALL_SERIES),
  createSeries: (data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Promise<Series> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_SERIES, data),
  updateSeries: (id: string, data: Partial<Series>): Promise<Series | undefined> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_SERIES, id, data),
  deleteSeries: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_SERIES, id),

  // ── Lectures ────────────────────────────────────────────────────────
  getLectures: (seriesId?: string): Promise<Lecture[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_LECTURES, seriesId),
  getLecture: (id: string): Promise<Lecture | undefined> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_LECTURE, id),
  createLecture: (data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lecture> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_LECTURE, data),
  updateLecture: (id: string, data: Partial<Lecture>): Promise<Lecture | undefined> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_LECTURE, id, data),
  deleteLecture: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_LECTURE, id),

  // ── Notes ───────────────────────────────────────────────────────────
  getNotes: (lectureId: string): Promise<Note[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_NOTES, lectureId),
  createNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_NOTE, data),
  updateNote: (id: string, data: Partial<Note>): Promise<Note | undefined> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_NOTE, id, data),
  deleteNote: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_NOTE, id),

  // ── Tags ────────────────────────────────────────────────────────────
  getAllTags: (): Promise<Tag[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_ALL_TAGS),
  createTag: (data: Omit<Tag, 'id'>): Promise<Tag> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_TAG, data),
  deleteTag: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_TAG, id),
  getNoteTags: (noteId: string): Promise<Tag[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_NOTE_TAGS, noteId),
  addNoteTag: (noteId: string, tagId: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_ADD_NOTE_TAG, noteId, tagId),
  removeNoteTag: (noteId: string, tagId: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_REMOVE_NOTE_TAG, noteId, tagId),

  // ── Bookmarks ───────────────────────────────────────────────────────
  getBookmarks: (lectureId: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_BOOKMARKS, lectureId),
  createBookmark: (data: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_BOOKMARK, data),
  deleteBookmark: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_BOOKMARK, id),

  // ── PDF Comments ────────────────────────────────────────────────────────
  getPdfComments: (pdfPath?: string, lectureId?: string): Promise<PdfComment[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_PDF_COMMENTS, pdfPath, lectureId),
  createPdfComment: (data: Omit<PdfComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<PdfComment> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_PDF_COMMENT, data),
  updatePdfComment: (id: string, data: Partial<PdfComment>): Promise<PdfComment | undefined> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_PDF_COMMENT, id, data),
  deletePdfComment: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_PDF_COMMENT, id),

  // ── Chapters ─────────────────────────────────────────────────────────
  getChapters: (lectureId: string): Promise<Chapter[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_CHAPTERS, lectureId),
  createChapter: (data: Omit<Chapter, 'id' | 'createdAt'>): Promise<Chapter> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_CHAPTER, data),
  deleteChapter: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_CHAPTER, id),

  // ── Study Sessions ─────────────────────────────────────────────────
  logSession: (data: Omit<StudySession, 'id'>): Promise<StudySession> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_LOG_SESSION, data),
  getSessions: (lectureId?: string): Promise<StudySession[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSIONS, lectureId),

  // ── Settings ────────────────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SETTINGS),
  updateSetting: (key: keyof AppSettings, value: string | number | boolean): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_SETTING, key, value),

  // ── Stats ───────────────────────────────────────────────────────────
  getStats: (): Promise<StudyStats> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_STATS),
  searchLibrary: (query: string): Promise<LibrarySearchResult[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_SEARCH_LIBRARY, query),
  getDueReviews: (): Promise<DueReviewItem[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_DUE_REVIEWS),
  updateReviewSchedule: (lectureId: string, rating: 'hard' | 'good' | 'easy'): Promise<ReviewSchedule> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_REVIEW_SCHEDULE, lectureId, rating),
  getWeeklyBreakdown: (): Promise<DailyStudyBreakdown[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_WEEKLY_BREAKDOWN),
  getSeriesPacing: (): Promise<SeriesPacingInfo[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SERIES_PACING),

  // ── Quran ────────────────────────────────────────────────────────────
  getSurahs: (): Promise<Surah[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.QURAN_GET_SURAHS),
  getAyah: (verseKey: string): Promise<Ayah | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.QURAN_GET_AYAH, verseKey),
  searchQuran: (query: string, limit?: number): Promise<Ayah[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.QURAN_SEARCH, query, limit),

  // ── File operations ─────────────────────────────────────────────────
  importAudio: (args: ImportAudioOptions | string, shouldCopy = false): Promise<any> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_IMPORT_AUDIO, args, shouldCopy),
  importPdf: (args: ImportPdfOptions | string, shouldCopy = false): Promise<any> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_IMPORT_PDF, args, shouldCopy),
  getAudioMetadata: (filePath: string): Promise<{ fileName: string; fileSizeBytes: number; path: string } | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_GET_AUDIO_METADATA, filePath),
  openDialog: (options: OpenDialogOptions): Promise<string[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_DIALOG, options),
  openFileDialog: (options: OpenDialogOptions): Promise<string[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_OPEN_DIALOG, options),
  readFileBuffer: (filePath: string): Promise<Uint8Array | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_READ_BUFFER, filePath),

  // ── App ─────────────────────────────────────────────────────────────
  getDataPath: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_DATA_PATH),

  // ── Backup & Restore ────────────────────────────────────────────────
  createBackup: (options: BackupCreateOptions): Promise<BackupCreateResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE, options),
  inspectBackup: (filePath: string): Promise<BackupInspectResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_INSPECT, filePath),
  restoreBackup: (options: BackupRestoreOptions): Promise<BackupRestoreResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, options),
  chooseBackupSavePath: (defaultName?: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CHOOSE_SAVE_PATH, defaultName),
  chooseBackupOpenPath: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CHOOSE_OPEN_PATH),
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('api', api);
