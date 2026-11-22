import { ipcMain, dialog, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC_CHANNELS } from '../../shared/types';
import type {
  Series,
  Lecture,
  Note,
  Bookmark,
  Chapter,
  StudySession,
  AppSettings,
  ImportAudioOptions,
  ImportPdfOptions,
  OpenDialogOptions,
} from '../../shared/types';
import * as database from '../database';

export function registerIpcHandlers(): void {
  // ── Series ──────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_ALL_SERIES, () => {
    return database.getAllSeries();
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_SERIES, (_event, data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => {
    return database.createSeries(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_SERIES, (_event, id: string, data: Partial<Series>) => {
    return database.updateSeries(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_SERIES, (_event, id: string) => {
    return database.deleteSeries(id);
  });

  // ── Lectures ────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_LECTURES, (_event, seriesId?: string) => {
    return database.getLectures(seriesId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_LECTURE, (_event, id: string) => {
    return database.getLecture(id);
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_LECTURE, (_event, data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>) => {
    return database.createLecture(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_LECTURE, (_event, id: string, data: Partial<Lecture>) => {
    return database.updateLecture(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_LECTURE, (_event, id: string) => {
    return database.deleteLecture(id);
  });

  // ── Notes ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_NOTES, (_event, lectureId: string) => {
    return database.getNotes(lectureId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_NOTE, (_event, data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    return database.createNote(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_NOTE, (_event, id: string, data: Partial<Note>) => {
    return database.updateNote(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_NOTE, (_event, id: string) => {
    return database.deleteNote(id);
  });

  // ── Bookmarks ───────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_BOOKMARKS, (_event, lectureId: string) => {
    return database.getBookmarks(lectureId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_BOOKMARK, (_event, data: Omit<Bookmark, 'id' | 'createdAt'>) => {
    return database.createBookmark(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_BOOKMARK, (_event, id: string) => {
    return database.deleteBookmark(id);
  });

  // ── Chapters ─────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_CHAPTERS, (_event, lectureId: string) => {
    return database.getChapters(lectureId);
  });

  ipcMain.handle(IPC_CHANNELS.DB_CREATE_CHAPTER, (_event, data: Omit<Chapter, 'id' | 'createdAt'>) => {
    return database.createChapter(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_DELETE_CHAPTER, (_event, id: string) => {
    return database.deleteChapter(id);
  });

  // ── Study Sessions ─────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_LOG_SESSION, (_event, data: Omit<StudySession, 'id'>) => {
    return database.logSession(data);
  });

  ipcMain.handle(IPC_CHANNELS.DB_GET_SESSIONS, (_event, lectureId?: string) => {
    return database.getSessions(lectureId);
  });

  // ── Settings ────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_SETTINGS, () => {
    return database.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.DB_UPDATE_SETTING, (_event, key: keyof AppSettings, value: string | number) => {
    database.updateSetting(key, value);
    return database.getSettings();
  });

  // ── Stats ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.DB_GET_STATS, () => {
    return database.getStats();
  });

  // ── File Operations ─────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.FILE_OPEN_DIALOG, async (_event, options: OpenDialogOptions) => {
    const res = await dialog.showOpenDialog(options as Electron.OpenDialogOptions);
    return res.canceled ? [] : res.filePaths;
  });

  ipcMain.handle(
    IPC_CHANNELS.FILE_IMPORT_AUDIO,
    async (_event, args: ImportAudioOptions | string, shouldCopyArg = false) => {
      let filePath: string;
      let shouldCopy = shouldCopyArg;
      let title = '';
      let seriesId: string | null = null;

      if (typeof args === 'string') {
        filePath = args;
      } else {
        filePath = args.filePath;
        shouldCopy = args.copyToLibrary;
        title = args.title;
        seriesId = args.seriesId;
      }

      let finalAudioPath = filePath;
      if (shouldCopy) {
        const libraryDir = path.join(app.getPath('userData'), 'library', 'audio');
        fs.mkdirSync(libraryDir, { recursive: true });
        finalAudioPath = path.join(libraryDir, `${Date.now()}-${path.basename(filePath)}`);
        fs.copyFileSync(filePath, finalAudioPath);
      }

      // If imported via options, also create the lecture in the database
      if (typeof args !== 'string') {
        const lectureTitle = title || path.basename(filePath, path.extname(filePath));
        const createdLecture = database.createLecture({
          seriesId,
          title: lectureTitle,
          orderIndex: 0,
          audioPath: finalAudioPath,
          pdfPath: null,
          isCopied: shouldCopy,
          duration: 0,
          lastPosition: 0,
          completionPct: 0,
        });

        // If series specified, update total lectures
        if (seriesId) {
          const allInSeries = database.getLectures(seriesId);
          database.updateSeries(seriesId, { totalLectures: allInSeries.length });
        }

        return createdLecture;
      }

      return { path: finalAudioPath, copied: shouldCopy };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FILE_IMPORT_PDF,
    async (_event, args: ImportPdfOptions | string, shouldCopyArg = false) => {
      let filePath: string;
      let shouldCopy = shouldCopyArg;
      let lectureId: string | null = null;

      if (typeof args === 'string') {
        filePath = args;
      } else {
        filePath = args.filePath;
        shouldCopy = args.copyToLibrary;
        lectureId = args.lectureId;
      }

      let finalPdfPath = filePath;
      if (shouldCopy) {
        const libraryDir = path.join(app.getPath('userData'), 'library', 'pdf');
        fs.mkdirSync(libraryDir, { recursive: true });
        finalPdfPath = path.join(libraryDir, `${Date.now()}-${path.basename(filePath)}`);
        fs.copyFileSync(filePath, finalPdfPath);
      }

      if (lectureId) {
        database.updateLecture(lectureId, { pdfPath: finalPdfPath });
      }

      return { path: finalPdfPath, copied: shouldCopy };
    }
  );

  ipcMain.handle(IPC_CHANNELS.FILE_GET_AUDIO_METADATA, async (_event, filePath: string) => {
    try {
      const stats = fs.statSync(filePath);
      return {
        fileName: path.basename(filePath),
        fileSizeBytes: stats.size,
        path: filePath,
      };
    } catch {
      return null;
    }
  });

  // ── App ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.APP_GET_DATA_PATH, () => {
    return app.getPath('userData');
  });
}
