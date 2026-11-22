import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type {
  Series,
  Lecture,
  Note,
  Tag,
  NoteTag,
  Bookmark,
  Chapter,
  StudySession,
  ReviewSchedule,
  AppSettings,
  StudyStats,
} from '../../shared/types';

let db: Database.Database;

// ── Initialization ──────────────────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'ilm-studio.db');
  db = new Database(dbPath);

  // Enable WAL for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedDefaults();
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS series (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      scholar       TEXT NOT NULL DEFAULT '',
      topic         TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      totalLectures INTEGER NOT NULL DEFAULT 0,
      createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lectures (
      id            TEXT PRIMARY KEY,
      seriesId      TEXT,
      title         TEXT NOT NULL,
      orderIndex    INTEGER NOT NULL DEFAULT 0,
      audioPath     TEXT,
      pdfPath       TEXT,
      isCopied      INTEGER NOT NULL DEFAULT 0,
      duration      REAL NOT NULL DEFAULT 0,
      lastPosition  REAL NOT NULL DEFAULT 0,
      completionPct REAL NOT NULL DEFAULT 0,
      createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (seriesId) REFERENCES series(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id             TEXT PRIMARY KEY,
      lectureId      TEXT NOT NULL,
      content        TEXT NOT NULL DEFAULT '{}',
      audioTimestamp REAL,
      pdfPage        INTEGER,
      createdAt      TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lectureId) REFERENCES lectures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('topic','scholar','book','custom'))
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      noteId TEXT NOT NULL,
      tagId  TEXT NOT NULL,
      PRIMARY KEY (noteId, tagId),
      FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId)  REFERENCES tags(id)  ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id        TEXT PRIMARY KEY,
      lectureId TEXT NOT NULL,
      type      TEXT NOT NULL CHECK (type IN ('audio','pdf')),
      position  REAL NOT NULL DEFAULT 0,
      label     TEXT NOT NULL DEFAULT '',
      note      TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lectureId) REFERENCES lectures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id        TEXT PRIMARY KEY,
      lectureId TEXT NOT NULL,
      startTime REAL NOT NULL DEFAULT 0,
      title     TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lectureId) REFERENCES lectures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id        TEXT PRIMARY KEY,
      lectureId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime   TEXT NOT NULL,
      duration  REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (lectureId) REFERENCES lectures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_schedule (
      id             TEXT PRIMARY KEY,
      lectureId      TEXT NOT NULL,
      nextReviewDate TEXT NOT NULL,
      intervalDays   INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (lectureId) REFERENCES lectures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  playbackSpeed: 1,
  dailyGoalMinutes: 30,
  defaultImportMode: 'ask',
  fontSize: 16,
  arabicFontSize: 22,
};

function seedDefaults(): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );
  const seed = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run(key, String(value));
    }
  });
  seed();
}

// ── Helpers ─────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

// ── Series CRUD ─────────────────────────────────────────────────────────

export function getAllSeries(): Series[] {
  return db.prepare('SELECT * FROM series ORDER BY updatedAt DESC').all() as Series[];
}

export function createSeries(data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Series {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO series (id, title, scholar, topic, description, totalLectures, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.title, data.scholar, data.topic, data.description, data.totalLectures, ts, ts);
  return { id, ...data, createdAt: ts, updatedAt: ts };
}

export function updateSeries(id: string, data: Partial<Omit<Series, 'id' | 'createdAt' | 'updatedAt'>>): Series | undefined {
  const existing = db.prepare('SELECT * FROM series WHERE id = ?').get(id) as Series | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updatedAt: now() };
  db.prepare(
    `UPDATE series SET title=?, scholar=?, topic=?, description=?, totalLectures=?, updatedAt=?
     WHERE id=?`
  ).run(merged.title, merged.scholar, merged.topic, merged.description, merged.totalLectures, merged.updatedAt, id);
  return merged;
}

export function deleteSeries(id: string): boolean {
  const result = db.prepare('DELETE FROM series WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Lectures CRUD ───────────────────────────────────────────────────────

export function getLectures(seriesId?: string): Lecture[] {
  if (seriesId) {
    return db.prepare('SELECT * FROM lectures WHERE seriesId = ? ORDER BY orderIndex').all(seriesId) as Lecture[];
  }
  return db.prepare('SELECT * FROM lectures ORDER BY updatedAt DESC').all() as Lecture[];
}

export function getLecture(id: string): Lecture | undefined {
  const row = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as (Record<string, unknown> | undefined);
  if (!row) return undefined;
  return { ...row, isCopied: Boolean(row.isCopied) } as unknown as Lecture;
}

export function createLecture(data: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>): Lecture {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO lectures (id, seriesId, title, orderIndex, audioPath, pdfPath, isCopied, duration, lastPosition, completionPct, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, data.seriesId, data.title, data.orderIndex,
    data.audioPath, data.pdfPath, data.isCopied ? 1 : 0,
    data.duration, data.lastPosition, data.completionPct,
    ts, ts
  );
  return { id, ...data, createdAt: ts, updatedAt: ts };
}

export function updateLecture(id: string, data: Partial<Omit<Lecture, 'id' | 'createdAt' | 'updatedAt'>>): Lecture | undefined {
  const existing = getLecture(id);
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updatedAt: now() };
  db.prepare(
    `UPDATE lectures SET seriesId=?, title=?, orderIndex=?, audioPath=?, pdfPath=?, isCopied=?,
     duration=?, lastPosition=?, completionPct=?, updatedAt=?
     WHERE id=?`
  ).run(
    merged.seriesId, merged.title, merged.orderIndex,
    merged.audioPath, merged.pdfPath, merged.isCopied ? 1 : 0,
    merged.duration, merged.lastPosition, merged.completionPct,
    merged.updatedAt, id
  );
  return merged;
}

export function deleteLecture(id: string): boolean {
  return db.prepare('DELETE FROM lectures WHERE id = ?').run(id).changes > 0;
}

// ── Notes CRUD ──────────────────────────────────────────────────────────

export function getNotes(lectureId: string): Note[] {
  return db.prepare('SELECT * FROM notes WHERE lectureId = ? ORDER BY audioTimestamp, createdAt').all(lectureId) as Note[];
}

export function createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO notes (id, lectureId, content, audioTimestamp, pdfPage, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.lectureId, data.content, data.audioTimestamp, data.pdfPage, ts, ts);
  return { id, ...data, createdAt: ts, updatedAt: ts };
}

export function updateNote(id: string, data: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Note | undefined {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
  if (!existing) return undefined;
  const merged = { ...existing, ...data, updatedAt: now() };
  db.prepare(
    `UPDATE notes SET content=?, audioTimestamp=?, pdfPage=?, updatedAt=? WHERE id=?`
  ).run(merged.content, merged.audioTimestamp, merged.pdfPage, merged.updatedAt, id);
  return merged;
}

export function deleteNote(id: string): boolean {
  return db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0;
}

// ── Tags ────────────────────────────────────────────────────────────────

export function getAllTags(): Tag[] {
  return db.prepare('SELECT * FROM tags ORDER BY category, name').all() as Tag[];
}

export function createTag(data: Omit<Tag, 'id'>): Tag {
  const id = uuid();
  db.prepare('INSERT INTO tags (id, name, category) VALUES (?, ?, ?)').run(id, data.name, data.category);
  return { id, ...data };
}

export function addNoteTag(noteId: string, tagId: string): void {
  db.prepare('INSERT OR IGNORE INTO note_tags (noteId, tagId) VALUES (?, ?)').run(noteId, tagId);
}

export function removeNoteTag(noteId: string, tagId: string): void {
  db.prepare('DELETE FROM note_tags WHERE noteId = ? AND tagId = ?').run(noteId, tagId);
}

// ── Bookmarks ───────────────────────────────────────────────────────────

export function getBookmarks(lectureId: string): Bookmark[] {
  return db.prepare('SELECT * FROM bookmarks WHERE lectureId = ? ORDER BY position').all(lectureId) as Bookmark[];
}

export function createBookmark(data: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO bookmarks (id, lectureId, type, position, label, note, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.lectureId, data.type, data.position, data.label, data.note, ts);
  return { id, ...data, createdAt: ts };
}

export function deleteBookmark(id: string): boolean {
  return db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id).changes > 0;
}

// ── Chapters ────────────────────────────────────────────────────────────

export function getChapters(lectureId: string): Chapter[] {
  return db.prepare('SELECT * FROM chapters WHERE lectureId = ? ORDER BY startTime').all(lectureId) as Chapter[];
}

export function createChapter(data: Omit<Chapter, 'id' | 'createdAt'>): Chapter {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO chapters (id, lectureId, startTime, title, createdAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, data.lectureId, data.startTime, data.title, ts);
  return { id, ...data, createdAt: ts };
}

export function deleteChapter(id: string): boolean {
  return db.prepare('DELETE FROM chapters WHERE id = ?').run(id).changes > 0;
}

// ── Study Sessions ──────────────────────────────────────────────────────

export function logSession(data: Omit<StudySession, 'id'>): StudySession {
  const id = uuid();
  db.prepare(
    `INSERT INTO study_sessions (id, lectureId, startTime, endTime, duration)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, data.lectureId, data.startTime, data.endTime, data.duration);
  return { id, ...data };
}

export function getSessions(lectureId?: string): StudySession[] {
  if (lectureId) {
    return db.prepare('SELECT * FROM study_sessions WHERE lectureId = ? ORDER BY startTime DESC').all(lectureId) as StudySession[];
  }
  return db.prepare('SELECT * FROM study_sessions ORDER BY startTime DESC').all() as StudySession[];
}

// ── Review Schedule ─────────────────────────────────────────────────────

export function getReviewSchedule(lectureId: string): ReviewSchedule | undefined {
  return db.prepare('SELECT * FROM review_schedule WHERE lectureId = ?').get(lectureId) as ReviewSchedule | undefined;
}

export function upsertReviewSchedule(data: Omit<ReviewSchedule, 'id'>): ReviewSchedule {
  const existing = getReviewSchedule(data.lectureId);
  if (existing) {
    db.prepare(
      'UPDATE review_schedule SET nextReviewDate=?, intervalDays=? WHERE id=?'
    ).run(data.nextReviewDate, data.intervalDays, existing.id);
    return { ...existing, ...data };
  }
  const id = uuid();
  db.prepare(
    'INSERT INTO review_schedule (id, lectureId, nextReviewDate, intervalDays) VALUES (?, ?, ?, ?)'
  ).run(id, data.lectureId, data.nextReviewDate, data.intervalDays);
  return { id, ...data };
}

// ── Settings ────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof AppSettings;
    if (key in settings) {
      const target = DEFAULT_SETTINGS[key];
      if (typeof target === 'number') {
        (settings as Record<string, unknown>)[key] = Number(row.value);
      } else {
        (settings as Record<string, unknown>)[key] = row.value;
      }
    }
  }
  return settings;
}

export function updateSetting(key: keyof AppSettings, value: string | number): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

// ── Stats ───────────────────────────────────────────────────────────────

export function getStats(): StudyStats {
  const totalSeries = (db.prepare('SELECT COUNT(*) as c FROM series').get() as { c: number }).c;
  const totalLectures = (db.prepare('SELECT COUNT(*) as c FROM lectures').get() as { c: number }).c;
  const completedLectures = (db.prepare('SELECT COUNT(*) as c FROM lectures WHERE completionPct >= 100').get() as { c: number }).c;

  const totalStudyTime = (db.prepare('SELECT COALESCE(SUM(duration), 0) as s FROM study_sessions').get() as { s: number }).s;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySeconds = (db.prepare(
    "SELECT COALESCE(SUM(duration), 0) as s FROM study_sessions WHERE date(startTime) = ?"
  ).get(todayStr) as { s: number }).s;

  // Week: last 7 days
  const weekSeconds = (db.prepare(
    "SELECT COALESCE(SUM(duration), 0) as s FROM study_sessions WHERE date(startTime) >= date('now', '-7 days')"
  ).get() as { s: number }).s;

  // Streaks: count distinct days with sessions
  const studyDays = (db.prepare(
    "SELECT DISTINCT date(startTime) as d FROM study_sessions ORDER BY d DESC"
  ).all() as { d: string }[]).map(r => r.d);

  let currentStreak = 0;
  let longestStreak = 0;
  if (studyDays.length > 0) {
    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = today;
    for (const day of studyDays) {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 1) {
        currentStreak++;
        checkDate = d;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let streak = 1;
    for (let i = 1; i < studyDays.length; i++) {
      const prev = new Date(studyDays[i - 1]);
      const curr = new Date(studyDays[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak, currentStreak);
  }

  const recentSessions = db.prepare(
    'SELECT * FROM study_sessions ORDER BY startTime DESC LIMIT 10'
  ).all() as StudySession[];

  return {
    totalSeries,
    totalLectures,
    completedLectures,
    totalStudyTimeMinutes: Math.round(totalStudyTime / 60),
    currentStreak,
    longestStreak,
    todayMinutes: Math.round(todaySeconds / 60),
    weekMinutes: Math.round(weekSeconds / 60),
    recentSessions,
  };
}

export function getDb(): Database.Database {
  return db;
}
