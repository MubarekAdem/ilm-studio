import { app, BrowserWindow, Tray, Menu, protocol, net } from 'electron';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pathToFileURL } from 'url';
import { initDatabase, getSettings, getStats } from './database';
import { initQuranDatabase } from './database/quran';
import { registerIpcHandlers } from './ipc/handlers';
import { triggerLaunchReminder, startChromeReminderMonitor, stopChromeReminderMonitor } from './reminders/reminderService';

// Set Windows App User Model ID for notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.mubarek.ilmstudio');
}

// Register custom privileged scheme for offline media streaming (audio & pdf)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'ilm-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function getAppIconPath(): string {
  const isWin = process.platform === 'win32';
  const iconFile = isWin ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(process.resourcesPath, iconFile),
    path.join(process.resourcesPath, 'assets', iconFile),
    path.join(app.getAppPath(), 'assets', iconFile),
    path.join(__dirname, '..', '..', 'assets', iconFile),
    path.join(app.getAppPath(), 'assets', 'icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.join(app.getAppPath(), 'assets', 'icon.png');
}

function createTray(): void {
  if (tray) return;

  const iconPath = getAppIconPath();
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('Ilm Studio (عِلم ستوديو) — Islamic Lecture Study');

    const updateTrayMenu = () => {
      let statsText = "Today's Study Progress";
      try {
        const stats = getStats();
        const settings = getSettings();
        statsText = `⏱️ Today: ${stats.todayMinutes}m / ${settings.dailyGoalMinutes}m`;
      } catch {
        // DB might not be ready yet
      }

      const contextMenu = Menu.buildFromTemplate([
        {
          label: '🕌 Open Ilm Studio',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: statsText,
          enabled: false,
        },
        { type: 'separator' },
        {
          label: '❌ Quit Ilm Studio',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]);

      tray?.setContextMenu(contextMenu);
    };

    updateTrayMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    tray.on('click', () => {
      updateTrayMenu();
    });
  } catch (err) {
    console.warn('System tray creation failed:', err);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    show: false,
    icon: getAppIconPath(),
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for better-sqlite3 native module via preload
    },
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Renderer fail-load] ${errorCode}: ${errorDescription} (${validatedURL})`);
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Show window once content is ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // Trigger launch reminder after window is displayed
    setTimeout(() => {
      triggerLaunchReminder(() => mainWindow);
    }, 2000);
  });

  // Minimize to tray instead of quitting if enabled in settings
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      try {
        const settings = getSettings();
        if (settings.minimizeToTrayEnabled) {
          event.preventDefault();
          mainWindow?.hide();
          return;
        }
      } catch (err) {
        console.error('Error checking tray setting:', err);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  stopChromeReminderMonitor();
});

app.on('ready', () => {
  // Register custom streamable media protocol for offline audio & PDF playback (with HTTP 206 range support)
  protocol.handle('ilm-media', (request) => {
    try {
      const url = new URL(request.url);
      const rawPath = url.searchParams.get('path');
      if (!rawPath || !fs.existsSync(rawPath)) {
        return new Response('File not found', { status: 404 });
      }

      const stat = fs.statSync(rawPath);
      const fileSize = stat.size;
      const range = request.headers.get('range');

      const ext = path.extname(rawPath).toLowerCase();
      let mime = 'audio/mpeg';
      if (ext === '.wav') mime = 'audio/wav';
      else if (ext === '.ogg') mime = 'audio/ogg';
      else if (ext === '.m4a' || ext === '.aac') mime = 'audio/mp4';
      else if (ext === '.flac') mime = 'audio/flac';
      else if (ext === '.pdf') mime = 'application/pdf';

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(rawPath, { start, end });
        const webStream = Readable.toWeb(fileStream) as any;

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': mime,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const fileStream = fs.createReadStream(rawPath);
      const webStream = Readable.toWeb(fileStream) as any;
      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes',
          'Content-Type': mime,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      console.error('[ilm-media] Protocol error:', err);
      return new Response('Media protocol error', { status: 500 });
    }
  });

  initDatabase();
  initQuranDatabase();
  registerIpcHandlers();
  createWindow();
  createTray();
  startChromeReminderMonitor(() => mainWindow);
});

app.on('window-all-closed', () => {
  // If minimize to tray is enabled, do not quit on window close
  try {
    const settings = getSettings();
    if (settings.minimizeToTrayEnabled) {
      return;
    }
  } catch {
    // fallback
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
