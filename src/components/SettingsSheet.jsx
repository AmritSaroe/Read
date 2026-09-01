import { useState } from 'react';
import { IconX, IconSun, IconMoon, IconContrast, IconBug, IconDownload, IconTrash } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isEnabled, setLoggingEnabled, getLogs, clearLogs, exportLogs } from '../utils/logger';

const THEMES = [
  { mode: 'light', Icon: IconSun,      label: 'Light'  },
  { mode: 'dark',  Icon: IconMoon,     label: 'Dark'   },
  { mode: 'sepia', Icon: IconContrast, label: 'Sepia'  },
];

/**
 * SettingsSheet — rendered at App level (outside scroll containers)
 * so the backdrop covers the full app-shell and navigation works correctly.
 *
 * Props:
 *   isOpen        boolean
 *   onClose       fn()
 *   themeMode     string
 *   resolvedTheme string
 *   setThemeMode  fn(mode)
 */
export default function SettingsSheet({ isOpen, onClose, themeMode, resolvedTheme, setThemeMode }) {
  const [loggingEnabled, setLoggingEnabledState] = useState(isEnabled);
  const [exportStatus, setExportStatus] = useState(null); // null | 'exporting' | {success, path?, error?}
  const [logCount, setLogCount] = useState(() => getLogs().length);

  const activeTheme = themeMode === 'auto' ? resolvedTheme : themeMode;

  const handleLoggingToggle = () => {
    const next = !loggingEnabled;
    setLoggingEnabled(next);
    setLoggingEnabledState(next);
    setLogCount(getLogs().length);
  };

  const handleExport = async () => {
    setExportStatus('exporting');
    const result = await exportLogs();
    setExportStatus(result);
    setLogCount(getLogs().length);
    // Auto-clear status after 4s
    setTimeout(() => setExportStatus(null), 4000);
  };

  const handleClearLogs = () => {
    clearLogs();
    setLogCount(0);
    setExportStatus(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 400,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-page)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '0 0 48px',
              maxHeight: '85dvh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 8px' }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Settings</p>
              <button className="icon-btn" onClick={onClose} aria-label="Close settings">
                <IconX size={18} strokeWidth={2} />
              </button>
            </div>

            {/* ── Appearance ── */}
            <SectionLabel>Appearance</SectionLabel>
            <div style={{ padding: '0 24px 4px', display: 'flex', gap: 8 }}>
              {THEMES.map(({ mode, Icon, label }) => {
                const isActive = activeTheme === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    style={{
                      flex: 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 0',
                      borderRadius: 10,
                      border: isActive ? '1.5px solid var(--accent-fill)' : '0.5px solid var(--border)',
                      background: isActive ? 'var(--bg-card)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <Icon size={20} strokeWidth={1.75} color={isActive ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Divider />

            {/* ── Developer Options ── */}
            <SectionLabel>Developer</SectionLabel>

            {/* Enable logging toggle */}
            <ToggleRow
              Icon={IconBug}
              label="Enable logging"
              description="Captures all fetch, parse, nav, and storage events with timestamps and timing."
              checked={loggingEnabled}
              onToggle={handleLoggingToggle}
            />

            {/* Log stats + actions — shown only when logging is on */}
            {loggingEnabled && (
              <div style={{ padding: '0 24px 8px' }}>
                {/* Stats pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  marginBottom: 10,
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {logCount === 0 ? 'No log entries yet' : `${logCount} entries in buffer`}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary, var(--text-secondary))' }}>
                    max 2000
                  </span>
                </div>

                {/* Export status banner */}
                {exportStatus && exportStatus !== 'exporting' && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 10,
                    background: exportStatus.success ? 'color-mix(in srgb, var(--bg-card) 60%, #22c55e)' : 'color-mix(in srgb, var(--bg-card) 60%, #ef4444)',
                    border: '0.5px solid var(--border)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}>
                    {exportStatus.success
                      ? `✓ Saved to ${exportStatus.path}`
                      : `✗ Export failed: ${exportStatus.error}`}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleExport}
                    disabled={exportStatus === 'exporting' || logCount === 0}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px',
                      borderRadius: 10,
                      border: '0.5px solid var(--border)',
                      background: 'var(--bg-card)',
                      cursor: logCount === 0 ? 'not-allowed' : 'pointer',
                      opacity: logCount === 0 ? 0.5 : 1,
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <IconDownload size={16} strokeWidth={2} />
                    {exportStatus === 'exporting' ? 'Exporting…' : 'Export log'}
                  </button>
                  <button
                    onClick={handleClearLogs}
                    disabled={logCount === 0}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '0.5px solid var(--border)',
                      background: 'var(--bg-card)',
                      cursor: logCount === 0 ? 'not-allowed' : 'pointer',
                      opacity: logCount === 0 ? 0.5 : 1,
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--text-secondary)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <IconTrash size={16} strokeWidth={2} />
                    Clear
                  </button>
                </div>

                {/* Log levels legend */}
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Log levels captured</p>
                  {[
                    { level: 'DEBUG',    note: 'Every sub-step (proxy URL, DOM size, etc.)' },
                    { level: 'INFO',     note: 'Success events + timing'                    },
                    { level: 'WARN',     note: 'Proxy fallbacks, short responses'           },
                    { level: 'ERROR',    note: 'Failed fetches, parse failures'             },
                    { level: 'CRITICAL', note: 'App-level fatal events'                     },
                  ].map(({ level, note }) => (
                    <div key={level} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', width: 60, flexShrink: 0 }}>{level}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{note}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Categories: APP · NAV · FETCH · PARSE · STORAGE · THEME · UI · ERROR
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Sub-components ── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      padding: '16px 24px 8px',
    }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'var(--border)', margin: '4px 0' }} />;
}

function ToggleRow({ Icon, label, description, checked, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px' }}>
      <Icon size={18} strokeWidth={1.75} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</p>
        {description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</p>}
      </div>
      {/* Animated toggle switch */}
      <div
        onClick={onToggle} role="switch" aria-checked={checked}
        style={{
          width: 44, height: 26, borderRadius: 999,
          backgroundColor: checked ? 'var(--accent-fill)' : 'var(--border-strong)',
          position: 'relative', cursor: 'pointer',
          transition: 'background-color 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: checked ? 'var(--accent-on)' : 'var(--bg-page)',
          transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  );
}
