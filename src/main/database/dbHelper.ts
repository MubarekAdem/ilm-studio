import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Resolves the absolute path to the native better_sqlite3.node binary.
 * Prevents Webpack "Cannot find module 'undefinedbuild/Release/better_sqlite3.node'" errors.
 */
export function getBetterSqlite3Binding(): string | undefined {
  const candidates = [
    // 1. Webpack native_modules output in .webpack/main
    path.join(__dirname, 'native_modules', 'build', 'Release', 'better_sqlite3.node'),
    // 2. Relative to app root in development
    path.join(app.getAppPath(), '.webpack', 'main', 'native_modules', 'build', 'Release', 'better_sqlite3.node'),
    // 3. Directly in node_modules
    path.join(app.getAppPath(), 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
    // 4. Packaged resources/app.asar.unpacked
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Continue searching
    }
  }
  return undefined;
}

/**
 * Instantiates a better-sqlite3 database with the explicit native addon path.
 */
export function openDatabase(dbPath: string, options: Database.Options = {}): Database.Database {
  const nativeBinding = getBetterSqlite3Binding();
  if (nativeBinding) {
    return new Database(dbPath, { ...options, nativeBinding });
  }
  return new Database(dbPath, options);
}
