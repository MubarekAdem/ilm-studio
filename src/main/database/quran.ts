import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { Surah, Ayah } from '../../shared/types';

let quranDb: Database.Database | null = null;

function getQuranDbPath(): string {
  // Development paths
  const devPath = path.join(app.getAppPath(), 'assets', 'quran.db');
  if (fs.existsSync(devPath)) return devPath;

  // Packaged app paths
  const resourcesPath = path.join(process.resourcesPath, 'assets', 'quran.db');
  if (fs.existsSync(resourcesPath)) return resourcesPath;

  const directResource = path.join(process.resourcesPath, 'quran.db');
  if (fs.existsSync(directResource)) return directResource;

  const fallbackPath = path.join(__dirname, '..', '..', 'assets', 'quran.db');
  if (fs.existsSync(fallbackPath)) return fallbackPath;

  return devPath;
}

export function initQuranDatabase(): void {
  const dbPath = getQuranDbPath();
  if (!fs.existsSync(dbPath)) {
    console.warn('Quran database file not found at:', dbPath);
    return;
  }
  try {
    quranDb = new Database(dbPath, { readonly: true });
    quranDb.pragma('journal_mode = OFF');
    console.log('Loaded offline Quran database successfully from:', dbPath);
  } catch (err) {
    console.error('Failed to open Quran database:', err);
  }
}

export function getSurahs(): Surah[] {
  if (!quranDb) return [];
  return quranDb.prepare('SELECT * FROM surahs ORDER BY id ASC').all() as Surah[];
}

export function getAyah(verseKey: string): Ayah | null {
  if (!quranDb) return null;
  const row = quranDb
    .prepare(
      `SELECT a.*, s.name_arabic as surah_name_arabic, s.name_simple as surah_name_simple, s.name_english as surah_name_english
       FROM ayahs a
       JOIN surahs s ON s.id = a.surah_id
       WHERE a.verse_key = ?`
    )
    .get(verseKey.trim()) as Ayah | undefined;

  return row ?? null;
}

export function searchQuran(query: string, limit = 20): Ayah[] {
  if (!quranDb || !query.trim()) return [];
  const q = query.trim();

  // If query is formatted like "2:255" or "112:1"
  if (/^\d{1,3}:\d{1,3}$/.test(q)) {
    const single = getAyah(q);
    return single ? [single] : [];
  }

  // If query is just a surah number e.g. "114"
  const surahNum = parseInt(q, 10);
  if (!isNaN(surahNum) && surahNum >= 1 && surahNum <= 114 && String(surahNum) === q) {
    return quranDb
      .prepare(
        `SELECT a.*, s.name_arabic as surah_name_arabic, s.name_simple as surah_name_simple, s.name_english as surah_name_english
         FROM ayahs a
         JOIN surahs s ON s.id = a.surah_id
         WHERE a.surah_id = ?
         ORDER BY a.ayah_number ASC
         LIMIT ?`
      )
      .all(surahNum, limit) as Ayah[];
  }

  // Keyword search in English translation or Arabic text
  const searchPattern = `%${q}%`;
  return quranDb
    .prepare(
      `SELECT a.*, s.name_arabic as surah_name_arabic, s.name_simple as surah_name_simple, s.name_english as surah_name_english
       FROM ayahs a
       JOIN surahs s ON s.id = a.surah_id
       WHERE a.translation_en LIKE ? OR a.text_uthmani LIKE ? OR s.name_simple LIKE ?
       ORDER BY a.surah_id ASC, a.ayah_number ASC
       LIMIT ?`
    )
    .all(searchPattern, searchPattern, searchPattern, limit) as Ayah[];
}
