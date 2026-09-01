/**
 * logger.js — Comprehensive in-memory logger for Read app
 *
 * Features:
 * - 5 levels: DEBUG / INFO / WARN / ERROR / CRITICAL
 * - Categories: APP | NAV | FETCH | PARSE | STORAGE | THEME | UI | ERROR
 * - Timestamps (ISO 8601 + relative ms since app start)
 * - In-memory circular buffer (max 2000 entries)
 * - Optional localStorage persistence (written every 10s when logging is on)
 * - Export as .txt log file via Capacitor Filesystem or browser download
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const LOG_ENABLED_KEY  = 'dev_logging_enabled';
const LOG_STORAGE_KEY  = 'dev_log_buffer';
const MAX_ENTRIES      = 2000;
const PERSIST_INTERVAL = 10_000; // ms

const APP_START = Date.now();

export const Level = Object.freeze({
  DEBUG:    'DEBUG',
  INFO:     'INFO',
  WARN:     'WARN',
  ERROR:    'ERROR',
  CRITICAL: 'CRITICAL',
});

export const Category = Object.freeze({
  APP:     'APP',
  NAV:     'NAV',
  FETCH:   'FETCH',
  PARSE:   'PARSE',
  STORAGE: 'STORAGE',
  THEME:   'THEME',
  UI:      'UI',
  ERROR:   'ERROR',
});

// In-memory buffer
let buffer = [];
let persistTimer = null;

// ── Internal: add entry ──────────────────────────────────────────────────────
function addEntry(level, category, message, data = undefined) {
  if (!isEnabled()) return;

  const now = new Date();
  const entry = {
    t:        now.toISOString(),
    ms:       Date.now() - APP_START,
    level,
    category,
    message,
    ...(data !== undefined ? { data } : {}),
  };

  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift(); // circular

  // Console output with colour hint
  const prefix = `[Read][${category}][${level}] +${entry.ms}ms`;
  if (level === Level.ERROR || level === Level.CRITICAL) {
    console.error(prefix, message, data ?? '');
  } else if (level === Level.WARN) {
    console.warn(prefix, message, data ?? '');
  } else {
    console.log(prefix, message, data ?? '');
  }

  schedulePersist();
}

// ── Public API ───────────────────────────────────────────────────────────────
export function isEnabled() {
  return localStorage.getItem(LOG_ENABLED_KEY) === 'true';
}

export function setLoggingEnabled(val) {
  localStorage.setItem(LOG_ENABLED_KEY, String(val));
  if (val) {
    log.info(Category.APP, 'Developer logging enabled', { platform: Capacitor.getPlatform() });
  } else {
    clearPersistTimer();
  }
}

export const log = {
  debug:    (category, message, data) => addEntry(Level.DEBUG,    category, message, data),
  info:     (category, message, data) => addEntry(Level.INFO,     category, message, data),
  warn:     (category, message, data) => addEntry(Level.WARN,     category, message, data),
  error:    (category, message, data) => addEntry(Level.ERROR,    category, message, data),
  critical: (category, message, data) => addEntry(Level.CRITICAL, category, message, data),
};

export function getLogs() {
  return [...buffer];
}

export function clearLogs() {
  buffer = [];
  localStorage.removeItem(LOG_STORAGE_KEY);
  log.info(Category.APP, 'Logs cleared by user');
}

// ── Persistence ──────────────────────────────────────────────────────────────
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(buffer));
    } catch {
      // Storage quota — trim and retry
      buffer = buffer.slice(-500);
      try { localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(buffer)); } catch { /* give up */ }
    }
    persistTimer = null;
  }, PERSIST_INTERVAL);
}

function clearPersistTimer() {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
}

// Restore buffer from localStorage on module load
try {
  const saved = localStorage.getItem(LOG_STORAGE_KEY);
  if (saved) buffer = JSON.parse(saved);
} catch { buffer = []; }

// ── Export ───────────────────────────────────────────────────────────────────
function formatLogsAsText(entries) {
  const header = [
    '='.repeat(60),
    `READ APP — Developer Log`,
    `Exported: ${new Date().toISOString()}`,
    `Platform: ${Capacitor.getPlatform()}`,
    `Entries:  ${entries.length}`,
    '='.repeat(60),
    '',
  ].join('\n');

  const body = entries.map(e => {
    const data = e.data !== undefined ? `\n    DATA: ${JSON.stringify(e.data)}` : '';
    return `[${e.t}] [+${e.ms}ms] [${e.level}] [${e.category}] ${e.message}${data}`;
  }).join('\n');

  return header + body + '\n';
}

export async function exportLogs() {
  const entries = getLogs();
  const text    = formatLogsAsText(entries);
  const filename = `read-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;

  if (Capacitor.getPlatform() !== 'web') {
    // Android / iOS: write to the Documents directory (user-accessible)
    try {
      await Filesystem.writeFile({
        path:      filename,
        data:      text,
        directory: Directory.Documents,
        encoding:  Encoding.UTF8,
      });
      return { success: true, path: `Documents/${filename}` };
    } catch (err) {
      // Fallback to ExternalStorage on Android if Documents fails
      try {
        await Filesystem.writeFile({
          path:      `Download/${filename}`,
          data:      text,
          directory: Directory.ExternalStorage,
          encoding:  Encoding.UTF8,
        });
        return { success: true, path: `Download/${filename}` };
      } catch (err2) {
        return { success: false, error: err2.message };
      }
    }
  } else {
    // Web / dev: trigger browser download
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, path: filename };
  }
}
