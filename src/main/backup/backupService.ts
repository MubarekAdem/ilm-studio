import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import * as database from '../database';
import type {
  BackupCreateOptions,
  BackupCreateResult,
  BackupInspectResult,
  BackupManifest,
  BackupRestoreOptions,
  BackupRestoreResult,
} from '../../shared/types';

const APP_VERSION = '1.8.0';

/**
 * Creates a safety snapshot of the database before running any restore.
 */
export async function createSafetySnapshot(): Promise<string | undefined> {
  try {
    const userData = app.getPath('userData');
    const backupsDir = path.join(userData, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(backupsDir, `safety-snapshot-before-restore-${timestamp}.ilm`);

    const result = await createBackup({
      includeMedia: false,
      destinationPath: snapshotPath,
    });

    if (result.success && result.filePath) {
      // Keep only the 5 most recent safety snapshots to avoid disk bloat
      cleanOldSnapshots(backupsDir, 5);
      return result.filePath;
    }
  } catch (err) {
    console.error('Failed to create safety recovery snapshot:', err);
  }
  return undefined;
}

function cleanOldSnapshots(dir: string, maxFiles: number): void {
  try {
    const files = fs.readdirSync(dir)
      .filter((f) => f.startsWith('safety-snapshot-') && f.endsWith('.ilm'))
      .map((f) => ({ name: f, time: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxFiles) {
      for (const oldFile of files.slice(maxFiles)) {
        try {
          fs.unlinkSync(path.join(dir, oldFile.name));
        } catch {}
      }
    }
  } catch {}
}

/**
 * Creates an export backup archive (.ilm).
 */
export async function createBackup(options: BackupCreateOptions): Promise<BackupCreateResult> {
  try {
    const userData = app.getPath('userData');
    const db = database.getDb();

    // Checkpoint SQLite WAL to ensure all transactions are on disk
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {
      console.warn('WAL checkpoint notice:', e);
    }

    // Determine target file path
    let targetPath = options.destinationPath;
    if (!targetPath) {
      const nowStr = new Date().toISOString().slice(0, 10);
      const defaultName = `ilm-studio-backup-${nowStr}${options.includeMedia ? '-full' : ''}.ilm`;
      const res = await dialog.showSaveDialog({
        title: 'Save Ilm Studio Backup',
        defaultPath: defaultName,
        filters: [
          { name: 'Ilm Studio Backup (*.ilm)', extensions: ['ilm'] },
          { name: 'Zip Archive (*.zip)', extensions: ['zip'] },
        ],
      });
      if (res.canceled || !res.filePath) {
        return { success: false, error: 'Backup cancelled by user' };
      }
      targetPath = res.filePath;
    }

    // Export all database tables to structured JSON
    const series = db.prepare('SELECT * FROM series').all();
    const lectures = db.prepare('SELECT * FROM lectures').all();
    const notes = db.prepare('SELECT * FROM notes').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const note_tags = db.prepare('SELECT * FROM note_tags').all();
    const bookmarks = db.prepare('SELECT * FROM bookmarks').all();
    const pdf_comments = db.prepare('SELECT * FROM pdf_comments').all();
    const chapters = db.prepare('SELECT * FROM chapters').all();
    const study_sessions = db.prepare('SELECT * FROM study_sessions').all();
    const review_schedule = db.prepare('SELECT * FROM review_schedule').all();
    const settings = db.prepare('SELECT * FROM settings').all();

    const manifest: BackupManifest = {
      version: 1,
      appName: 'Ilm Studio',
      appVersion: APP_VERSION,
      createdAt: new Date().toISOString(),
      hasMedia: !!options.includeMedia,
      counts: {
        series: series.length,
        lectures: lectures.length,
        notes: notes.length,
        tags: tags.length,
        bookmarks: bookmarks.length,
        pdfComments: pdf_comments.length,
        chapters: chapters.length,
        sessions: study_sessions.length,
      },
    };

    const databaseDump = {
      manifest,
      tables: {
        series,
        lectures,
        notes,
        tags,
        note_tags,
        bookmarks,
        pdf_comments,
        chapters,
        study_sessions,
        review_schedule,
        settings,
      },
    };

    const zip = new AdmZip();

    // 1. Add manifest & json dump
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
    zip.addFile('database.json', Buffer.from(JSON.stringify(databaseDump, null, 2), 'utf8'));

    // 2. Add raw SQLite file if available
    const rawDbPath = path.join(userData, 'ilm-studio.db');
    if (fs.existsSync(rawDbPath)) {
      try {
        const rawDbBuf = fs.readFileSync(rawDbPath);
        zip.addFile('ilm-studio.db', rawDbBuf);
      } catch (e) {
        console.warn('Could not attach raw db buffer, relying on JSON dump:', e);
      }
    }

    // 3. Include media files if requested
    if (options.includeMedia) {
      const audioDir = path.join(userData, 'library', 'audio');
      if (fs.existsSync(audioDir)) {
        zip.addLocalFolder(audioDir, 'library/audio');
      }
      const pdfDir = path.join(userData, 'library', 'pdf');
      if (fs.existsSync(pdfDir)) {
        zip.addLocalFolder(pdfDir, 'library/pdf');
      }
    }

    // Write zip file
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    zip.writeZip(targetPath);

    const stats = fs.statSync(targetPath);

    return {
      success: true,
      filePath: targetPath,
      fileSizeBytes: stats.size,
      manifest,
    };
  } catch (err: any) {
    console.error('Error creating backup:', err);
    return {
      success: false,
      error: err?.message || 'Failed to create backup archive',
    };
  }
}

/**
 * Inspects a backup file and returns its manifest details.
 */
export async function inspectBackup(filePath: string): Promise<BackupInspectResult> {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, filePath, error: 'File does not exist' };
    }

    const zip = new AdmZip(filePath);
    const manifestEntry = zip.getEntry('manifest.json');

    if (!manifestEntry) {
      return {
        success: false,
        filePath,
        error: 'Invalid backup file: manifest.json is missing',
      };
    }

    const manifestContent = manifestEntry.getData().toString('utf8');
    const manifest: BackupManifest = JSON.parse(manifestContent);

    return {
      success: true,
      filePath,
      manifest,
    };
  } catch (err: any) {
    console.error('Error inspecting backup:', err);
    return {
      success: false,
      filePath,
      error: err?.message || 'Failed to inspect backup file',
    };
  }
}

/**
 * Restores a backup file in either 'merge' or 'clean' mode.
 */
export async function restoreBackup(options: BackupRestoreOptions): Promise<BackupRestoreResult> {
  try {
    const { filePath, mode } = options;
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Backup file does not exist' };
    }

    // 1. Take safety snapshot before modifying anything
    const safetySnapshotPath = await createSafetySnapshot();

    const zip = new AdmZip(filePath);
    const manifestEntry = zip.getEntry('manifest.json');
    const databaseEntry = zip.getEntry('database.json');

    if (!manifestEntry && !databaseEntry) {
      return { success: false, error: 'Invalid backup archive: missing data' };
    }

    const userData = app.getPath('userData');

    if (mode === 'clean') {
      // Clean Replace:
      // 1. Close current db
      database.closeDatabase();

      // 2. Extract raw SQLite file if present in zip
      const rawDbEntry = zip.getEntry('ilm-studio.db');
      if (rawDbEntry) {
        fs.writeFileSync(path.join(userData, 'ilm-studio.db'), rawDbEntry.getData());
      } else if (databaseEntry) {
        // Fallback: restore via JSON import if raw db isn't in zip
        database.reopenDatabase();
        const jsonDump = JSON.parse(databaseEntry.getData().toString('utf8'));
        restoreFromDatabaseJson(jsonDump, 'clean');
      }

      // 3. Extract media if available
      try {
        const audioEntries = zip.getEntries().filter((e) => e.entryName.startsWith('library/audio/') && !e.isDirectory);
        const pdfEntries = zip.getEntries().filter((e) => e.entryName.startsWith('library/pdf/') && !e.isDirectory);

        if (audioEntries.length > 0 || pdfEntries.length > 0) {
          zip.extractEntryTo('library/', userData, true, true);
        }
      } catch (e) {
        console.warn('Could not extract media entries during clean restore:', e);
      }

      // Reopen db
      database.reopenDatabase();

      const manifest: BackupManifest = manifestEntry
        ? JSON.parse(manifestEntry.getData().toString('utf8'))
        : { counts: {} };

      return {
        success: true,
        safetySnapshotPath,
        restoredCounts: {
          series: manifest.counts?.series || 0,
          lectures: manifest.counts?.lectures || 0,
          notes: manifest.counts?.notes || 0,
          pdfComments: manifest.counts?.pdfComments || 0,
        },
      };
    } else {
      // Merge Mode (non-destructive):
      if (!databaseEntry) {
        return { success: false, error: 'Cannot merge: database.json missing in backup' };
      }

      const jsonDump = JSON.parse(databaseEntry.getData().toString('utf8'));
      const counts = restoreFromDatabaseJson(jsonDump, 'merge');

      // Extract any media files that don't already exist locally
      try {
        const audioEntries = zip.getEntries().filter((e) => e.entryName.startsWith('library/audio/') && !e.isDirectory);
        const pdfEntries = zip.getEntries().filter((e) => e.entryName.startsWith('library/pdf/') && !e.isDirectory);

        for (const entry of [...audioEntries, ...pdfEntries]) {
          const targetLocalFile = path.join(userData, entry.entryName);
          if (!fs.existsSync(targetLocalFile)) {
            zip.extractEntryTo(entry, userData, true, true);
          }
        }
      } catch (e) {
        console.warn('Could not extract media entries during merge:', e);
      }

      return {
        success: true,
        safetySnapshotPath,
        restoredCounts: counts,
      };
    }
  } catch (err: any) {
    console.error('Error during backup restore:', err);
    return {
      success: false,
      error: err?.message || 'Restore process failed',
    };
  }
}

/**
 * Restores records from database.json into SQLite.
 */
function restoreFromDatabaseJson(
  dump: { tables: Record<string, any[]> },
  mode: 'merge' | 'clean'
): { series: number; lectures: number; notes: number; pdfComments: number } {
  const db = database.getDb();
  const t = dump.tables || {};

  const counts = {
    series: 0,
    lectures: 0,
    notes: 0,
    pdfComments: 0,
  };

  const runTransaction = db.transaction(() => {
    if (mode === 'clean') {
      db.prepare('DELETE FROM note_tags').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM notes').run();
      db.prepare('DELETE FROM bookmarks').run();
      db.prepare('DELETE FROM pdf_comments').run();
      db.prepare('DELETE FROM chapters').run();
      db.prepare('DELETE FROM study_sessions').run();
      db.prepare('DELETE FROM review_schedule').run();
      db.prepare('DELETE FROM lectures').run();
      db.prepare('DELETE FROM series').run();
    }

    // 1. Series
    if (Array.isArray(t.series)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO series (id, title, scholar, topic, description, totalLectures, createdAt, updatedAt)
        VALUES (@id, @title, @scholar, @topic, @description, @totalLectures, @createdAt, @updatedAt)
      `);
      for (const row of t.series) {
        stmt.run(row);
        counts.series++;
      }
    }

    // 2. Lectures
    if (Array.isArray(t.lectures)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO lectures (id, seriesId, title, orderIndex, audioPath, pdfPath, isCopied, duration, lastPosition, completionPct, createdAt, updatedAt)
        VALUES (@id, @seriesId, @title, @orderIndex, @audioPath, @pdfPath, @isCopied, @duration, @lastPosition, @completionPct, @createdAt, @updatedAt)
      `);
      for (const row of t.lectures) {
        stmt.run(row);
        counts.lectures++;
      }
    }

    // 3. Notes
    if (Array.isArray(t.notes)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO notes (id, lectureId, content, audioTimestamp, pdfPage, createdAt, updatedAt)
        VALUES (@id, @lectureId, @content, @audioTimestamp, @pdfPage, @createdAt, @updatedAt)
      `);
      for (const row of t.notes) {
        stmt.run(row);
        counts.notes++;
      }
    }

    // 4. Tags & Note Tags
    if (Array.isArray(t.tags)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tags (id, name, category)
        VALUES (@id, @name, @category)
      `);
      for (const row of t.tags) {
        stmt.run(row);
      }
    }

    if (Array.isArray(t.note_tags)) {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO note_tags (noteId, tagId)
        VALUES (@noteId, @tagId)
      `);
      for (const row of t.note_tags) {
        stmt.run(row);
      }
    }

    // 5. Bookmarks
    if (Array.isArray(t.bookmarks)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bookmarks (id, lectureId, type, position, label, note, createdAt)
        VALUES (@id, @lectureId, @type, @position, @label, @note, @createdAt)
      `);
      for (const row of t.bookmarks) {
        stmt.run(row);
      }
    }

    // 6. PDF Comments
    if (Array.isArray(t.pdf_comments)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO pdf_comments (id, pdfPath, lectureId, page, xPct, yPct, content, color, fontStyle, drawingData, createdAt, updatedAt)
        VALUES (@id, @pdfPath, @lectureId, @page, @xPct, @yPct, @content, @color, @fontStyle, @drawingData, @createdAt, @updatedAt)
      `);
      for (const row of t.pdf_comments) {
        stmt.run(row);
        counts.pdfComments++;
      }
    }

    // 7. Chapters
    if (Array.isArray(t.chapters)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO chapters (id, lectureId, startTime, title, createdAt)
        VALUES (@id, @lectureId, @startTime, @title, @createdAt)
      `);
      for (const row of t.chapters) {
        stmt.run(row);
      }
    }

    // 8. Study Sessions
    if (Array.isArray(t.study_sessions)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO study_sessions (id, lectureId, startTime, endTime, duration)
        VALUES (@id, @lectureId, @startTime, @endTime, @duration)
      `);
      for (const row of t.study_sessions) {
        stmt.run(row);
      }
    }

    // 9. Review Schedule
    if (Array.isArray(t.review_schedule)) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO review_schedule (id, lectureId, nextReviewDate, intervalDays)
        VALUES (@id, @lectureId, @nextReviewDate, @intervalDays)
      `);
      for (const row of t.review_schedule) {
        stmt.run(row);
      }
    }
  });

  runTransaction();
  return counts;
}
