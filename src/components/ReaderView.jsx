import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconChevronLeft,
  IconShare,
  IconX,
  IconSun,
  IconMoon,
  IconContrast,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypography } from '../hooks/useTypography';

/**
 * ReaderView — full reading screen — spec §3.4–3.6
 *
 * Props:
 *   article      Article object
 *   onBack       fn()
 *   onArchive    fn(article)
 *   resolvedTheme string
 */



const THEMES = [
  { mode: 'light', Icon: IconSun,      label: 'Light'  },
  { mode: 'dark',  Icon: IconMoon,     label: 'Dark'   },
  { mode: 'sepia', Icon: IconContrast, label: 'Sepia'  },
];

export default function ReaderView({ article, onBack, themeMode, resolvedTheme, setThemeMode }) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [fontSheetOpen, setFontSheetOpen] = useState(false);
  const { typography, setFontFamily, setFontSize, setLineHeight } = useTypography();

  const scrollRef = useRef(null);
  const bodyRef = useRef(null);
  const lastScrollY = useRef(0);

  const activeTheme = themeMode === 'auto' ? resolvedTheme : themeMode;

  // ── Scroll: hide chrome on scroll-down, tap to reveal — spec §3.5 ──
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    if (currentY > lastScrollY.current && chromeVisible) {
      setChromeVisible(false);
    }
    lastScrollY.current = currentY;

    // Progress bar
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable > 0 ? Math.min(100, (currentY / scrollable) * 100) : 0;
    setReadProgress(pct);
  }, [chromeVisible]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Tap anywhere in content → reveal chrome — spec §3.5
  const handleContentTap = useCallback(() => {
    setChromeVisible(true);
  }, []);



  const handleShareArticle = () => {
    if (navigator.share)
      navigator.share({ title: article.title, url: article.originalUrl }).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden' }}>

      {/* ── Top bar — spec §3.4 ── */}
      <AnimatePresence>
        {chromeVisible && (
          <motion.div
            initial={{ y: -52, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -52, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              height: 52,
              backgroundColor: 'var(--bg-page)',
              borderBottom: '0.5px solid var(--border)',
            }}
          >
            <button className="icon-btn" onClick={onBack} aria-label="Back">
              <IconChevronLeft size={18} strokeWidth={2} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* "Aa" — literal text, not an icon — spec §3.4 */}
              <button className="icon-btn" onClick={() => setFontSheetOpen(true)} aria-label="Font settings">
                <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em' }}>Aa</span>
              </button>
              <button className="icon-btn" onClick={handleShareArticle} aria-label="Share">
                <IconShare size={16} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable body ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          position: 'relative',
        }}
        onClick={handleContentTap}
      >
        <div style={{ padding: '64px 24px 80px' }}>
          {/* Title */}
          <h1 style={{
            fontSize: 22,
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginBottom: 10,
            letterSpacing: '-0.02em',
          }}>
            {article.title}
          </h1>

          {/* Metadata */}
          {(article.byline || article.siteName) && (
            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 28,
              lineHeight: 1.4,
            }}>
              {[article.byline, article.siteName].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Body — spec §1.4: Lora serif, 15px, 1.75, weight 400 */}
          <div
            ref={bodyRef}
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

      </div>

      {/* ── Progress bar — spec §3.5: 2px, always visible, pinned to bottom ── */}
      {/* Positioned absolute within the reader shell, not fixed to viewport */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 2,
        backgroundColor: 'var(--border)',
        zIndex: 200,
        pointerEvents: 'none',
      }}>
        <div style={{
          height: '100%',
          width: `${readProgress}%`,
          backgroundColor: 'var(--progress-fill)',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* ── Font settings sheet ── */}
      <AnimatePresence>
        {fontSheetOpen && (
          <motion.div
            style={{
              position: 'fixed',
              top: 0, bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 480,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'flex-end',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setFontSheetOpen(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-page)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: 48,
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-strong)' }} />
              </div>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Reading Style
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setFontSheetOpen(false)}
                  style={{ background: 'var(--bg-card)', borderRadius: 999, width: 30, height: 30 }}
                >
                  <IconX size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Live preview strip */}
              <div style={{
                margin: '0 20px 20px',
                padding: '14px 16px',
                background: 'var(--bg-card)',
                borderRadius: 14,
                border: '0.5px solid var(--border)',
              }}>
                <p style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.fontSize,
                  lineHeight: typography.lineHeight,
                  color: 'var(--text-body)',
                  margin: 0,
                  transition: 'all 0.2s ease',
                }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>

              {/* ── Theme ── */}
              <div style={{ padding: '0 20px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Theme
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
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
                          borderRadius: 12,
                          border: isActive ? '1.5px solid var(--text-primary)' : '0.5px solid var(--border)',
                          background: isActive ? 'var(--text-primary)' : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <Icon size={20} strokeWidth={1.75} color={isActive ? 'var(--bg-page)' : 'var(--text-secondary)'} />
                        <span style={{ fontSize: 12, fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--bg-page)' : 'var(--text-secondary)' }}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hairline divider */}
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0 20px' }} />

              {/* ── Typeface ── */}
              <div style={{ padding: '0 20px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Typeface
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { name: 'Inter',        label: 'Inter',        family: "'Inter', sans-serif",              preview: 'Aa' },
                    { name: 'Merriweather', label: 'Merriweather', family: "'Merriweather', serif",            preview: 'Aa' },
                    { name: 'Nunito',       label: 'Nunito',       family: "'Nunito', sans-serif",             preview: 'Aa' },
                    { name: 'Mono',         label: 'Monospace',    family: "'Source Code Pro', monospace",     preview: 'Aa' },
                  ].map(font => {
                    const isActive = typography.fontFamily === font.family;
                    return (
                      <button
                        key={font.name}
                        onClick={() => setFontFamily(font.family)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 4,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: isActive ? '1.5px solid var(--text-primary)' : '0.5px solid var(--border)',
                          background: isActive ? 'var(--text-primary)' : 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontFamily: font.family,
                          fontSize: 22,
                          fontWeight: 400,
                          lineHeight: 1,
                          color: isActive ? 'var(--bg-page)' : 'var(--text-primary)',
                        }}>
                          {font.preview}
                        </span>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: isActive ? 'var(--bg-card)' : 'var(--text-secondary)',
                          fontFamily: 'inherit',
                        }}>
                          {font.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hairline divider */}
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0 20px' }} />

              {/* ── Size ── */}
              <div style={{ padding: '0 20px', marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Text size · {typography.fontSize}px
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0, width: 14, textAlign: 'center' }}>A</span>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="range"
                      min="14" max="26" step="1"
                      value={typography.fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: 'var(--text-primary)', cursor: 'pointer' }}
                    />
                  </div>
                  <span style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0, width: 20, textAlign: 'center' }}>A</span>
                </div>
              </div>

              {/* Hairline divider */}
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 0 20px' }} />

              {/* ── Line spacing ── */}
              <div style={{ padding: '0 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Line spacing
                </p>
                <div style={{
                  display: 'flex',
                  background: 'var(--bg-card)',
                  borderRadius: 12,
                  border: '0.5px solid var(--border)',
                  overflow: 'hidden',
                }}>
                  {[
                    { label: 'Compact',  value: 1.4, icon: '▤' },
                    { label: 'Standard', value: 1.6, icon: '▥' },
                    { label: 'Relaxed',  value: 1.8, icon: '▦' },
                  ].map((lh, i) => {
                    const isActive = typography.lineHeight === lh.value;
                    return (
                      <button
                        key={lh.label}
                        onClick={() => setLineHeight(lh.value)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          padding: '12px 8px',
                          border: 'none',
                          borderLeft: i > 0 ? '0.5px solid var(--border)' : 'none',
                          background: isActive ? 'var(--text-primary)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 16, lineHeight: 1, color: isActive ? 'var(--bg-page)' : 'var(--text-secondary)' }}>
                          {lh.icon}
                        </span>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: isActive ? 'var(--bg-page)' : 'var(--text-secondary)',
                          fontFamily: 'inherit',
                        }}>
                          {lh.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

