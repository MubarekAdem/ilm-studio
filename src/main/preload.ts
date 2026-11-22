import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  Series,
  Lecture,
  Note,
  Bookmark,
  StudySession,
  AppSettings,
  StudyStats,
  ImportAudioOptions,
  ImportPdfOptions,
  OpenDialogOptions,
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

  // ── Bookmarks ───────────────────────────────────────────────────────
  getBookmarks: (lectureId: string): Promise<Bookmark[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_BOOKMARKS, lectureId),
  createBookmark: (data: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_CREATE_BOOKMARK, data),
  deleteBookmark: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_DELETE_BOOKMARK, id),

  // ── Study Sessions ─────────────────────────────────────────────────
  logSession: (data: Omit<StudySession, 'id'>): Promise<StudySession> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_LOG_SESSION, data),
  getSessions: (lectureId?: string): Promise<StudySession[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SESSIONS, lectureId),

  // ── Settings ────────────────────────────────────────────────────────
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_SETTINGS),
  updateSetting: (key: keyof AppSettings, value: string | number): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_UPDATE_SETTING, key, value),

  // ── Stats ───────────────────────────────────────────────────────────
  getStats: (): Promise<StudyStats> =>
    ipcRenderer.invoke(IPC_CHANNELS.DB_GET_STATS),

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

  // ── App ─────────────────────────────────────────────────────────────
  getDataPath: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_DATA_PATH),
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('api', api);
