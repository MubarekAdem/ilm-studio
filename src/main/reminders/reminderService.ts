import { BrowserWindow, Notification, app } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import * as database from '../database';

let lastChromeReminderTime = 0;
let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Checks whether Google Chrome (or Chromium) process is currently running on the OS.
 */
function isChromeRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? 'tasklist /FI "IMAGENAME eq chrome.exe" /NH'
      : 'pgrep -x chrome || pgrep -x google-chrome || pgrep -x chromium || pgrep -x "Google Chrome"';

    exec(cmd, { timeout: 4000, windowsHide: true }, (err, stdout) => {
      if (err) {
        resolve(false);
        return;
      }
      const output = stdout.toLowerCase();
      if (isWindows) {
        resolve(output.includes('chrome.exe'));
      } else {
        resolve(output.trim().length > 0);
      }
    });
  });
}

/**
 * Helper to show native OS desktop notification with click focus action.
 */
function sendDesktopNotification(
  title: string,
  body: string,
  getMainWindow: () => BrowserWindow | null
): void {
  if (!Notification.isSupported()) return;

  const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');

  const notification = new Notification({
    title,
    body,
    icon: iconPath,
    silent: false,
  });

  notification.on('click', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  notification.show();
}

/**
 * Trigger notification on initial app launch.
 */
export function triggerLaunchReminder(getMainWindow: () => BrowserWindow | null): void {
  try {
    const settings = database.getSettings();
    if (!settings.launchReminderEnabled) return;

    const stats = database.getStats();
    const reviews = database.getDueReviews();
    const dueReviewsCount = reviews.filter((r) => r.isDue).length;

    const remainingMinutes = Math.max(0, settings.dailyGoalMinutes - stats.todayMinutes);
    const goalCompleted = remainingMinutes === 0;

    const title = '🕌 Ilm Studio — Daily Study Target';
    let body = '';

    if (goalCompleted) {
      body = `🎉 Alhamdulillah! Today's ${settings.dailyGoalMinutes}m study target completed. Active streak: ${stats.currentStreak} days.`;
    } else {
      body = `Today's Focus: ${stats.todayMinutes}m / ${settings.dailyGoalMinutes}m (${remainingMinutes}m remaining).`;
    }

    if (dueReviewsCount > 0) {
      body += ` 📚 ${dueReviewsCount} lecture review(s) due today!`;
    }

    sendDesktopNotification(title, body, getMainWindow);
  } catch (err) {
    console.error('Failed to trigger launch reminder:', err);
  }
}

/**
 * Periodically checks for Chrome running and reminds if study goal is not met.
 */
export function startChromeReminderMonitor(getMainWindow: () => BrowserWindow | null): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }

  // Check every 60 seconds
  monitorInterval = setInterval(async () => {
    try {
      const settings = database.getSettings();
      if (!settings.chromeReminderEnabled) return;

      // Check throttling cooldown
      const intervalMs = (settings.reminderIntervalHours || 1) * 3600 * 1000;
      const now = Date.now();
      if (now - lastChromeReminderTime < intervalMs) {
        return;
      }

      // Check if today's study target is already satisfied
      const stats = database.getStats();
      if (stats.todayMinutes >= settings.dailyGoalMinutes) {
        return; // Goal reached, no need to interrupt browsing
      }

      const chromeActive = await isChromeRunning();
      if (!chromeActive) return;

      // Chrome is running & goal not met: trigger reminder
      lastChromeReminderTime = now;
      const remainingMinutes = Math.max(0, settings.dailyGoalMinutes - stats.todayMinutes);

      const title = '📖 Study Before Browsing — Ilm Studio';
      const body = `Remember your daily lecture! You have ${remainingMinutes}m remaining to reach today's ${settings.dailyGoalMinutes}m goal. Click to study now.`;

      sendDesktopNotification(title, body, getMainWindow);
    } catch (err) {
      console.error('Error in Chrome reminder monitor:', err);
    }
  }, 25000);
}

export function stopChromeReminderMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
