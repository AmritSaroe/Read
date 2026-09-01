import { useState, useEffect, useRef, useCallback } from 'react';
import {
  IconChevronLeft,
  IconShare,
  IconHighlight,
  IconCopy,
  IconX,
  IconTextSize,
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

/**
 * Re-applies saved highlight marks inside a DOM node.
 * We match by exact text substring and wrap first occurrence with <mark>.
 * This is best-effort; overlapping/duplicate texts are not guaranteed.
 */
function reApplyHighlights(rootEl, highlightTexts) {
  if (!rootEl || !highlightTexts.length) return;

  for (const { text } of highlightTexts) {
    if (!text) continue;
    // Walk all text nodes and find first matching one
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(text);
      if (idx !== -1) {
        const before = node.nodeValue.slice(0, idx);
        const after = node.nodeValue.slice(idx + text.length);
        const mark = document.createElement('mark');
        mark.textContent = text;
        const parent = node.parentNode;
        // Replace text node with [before text] + [mark] + [after text]
        if (before) parent.insertBefore(document.createTextNode(before), node);
        parent.insertBefore(mark, node);
        if (after) parent.insertBefore(document.createTextNode(after), node);
        parent.removeChild(node);
        break; // only mark first occurrence per saved highlight
      }
    }
  }
}

export default function ReaderView({ article, onBack }) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [fontSheetOpen, setFontSheetOpen] = useState(false);
  const { typography, setFontFamily, setFontSize, setLineHeight } = useTypography();
  const [highlights, setHighlights] = useState(() => {
    const stored = localStorage.getItem(`highlights_${article.id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [popover, setPopover] = useState(null);

  const scrollRef = useRef(null);
  const bodyRef = useRef(null);
  const lastScrollY = useRef(0);

  // Re-apply persisted highlights after article HTML renders
  useEffect(() => {
    if (bodyRef.current && highlights.length > 0) {
      reApplyHighlights(bodyRef.current, highlights);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
    setPopover(null);
  }, []);

  // ── Text selection popover — spec §3.6 ──
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setPopover(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const scrollEl = scrollRef.current;
    const scrollRect = scrollEl ? scrollEl.getBoundingClientRect() : { left: 0, top: 0 };
    setPopover({
      // Position relative to the scroll container so it's within the mobile shell
      x: rect.left + rect.width / 2 - scrollRect.left,
      y: rect.top - scrollRect.top + scrollEl.scrollTop,
      selectedText: sel.toString(),
      range: range.cloneRange(),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // Apply highlight — spec §3.6
  const applyHighlight = useCallback(() => {
    if (!popover?.range) return;
    const mark = document.createElement('mark');
    try {
      popover.range.surroundContents(mark);
    } catch {
      const frag = popover.range.extractContents();
      mark.appendChild(frag);
      popover.range.insertNode(mark);
    }
    const newHighlight = { text: popover.selectedText, id: Date.now() };
    const updated = [...highlights, newHighlight];
    setHighlights(updated);
    localStorage.setItem(`highlights_${article.id}`, JSON.stringify(updated));
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  }, [popover, highlights, article.id]);

  const handleCopy = useCallback(() => {
    if (popover?.selectedText) navigator.clipboard.writeText(popover.selectedText).catch(() => {});
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  }, [popover]);

  const handleShare = useCallback(() => {
    if (navigator.share && popover?.selectedText)
      navigator.share({ text: popover.selectedText, url: article.originalUrl }).catch(() => {});
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  }, [popover, article.originalUrl]);

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

        {/* Popover — positioned relative to scroll container — spec §3.6 */}
        <AnimatePresence>
          {popover && (
            <motion.div
              className="highlight-popover"
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                left: popover.x,
                top: popover.y - 48,
              }}
            >
              {/* Order: Highlight → Copy → Share — spec §3.6 */}
              <button className="popover-action" onClick={applyHighlight}>
                <IconHighlight size={14} strokeWidth={2} />
                Highlight
              </button>
              <div className="popover-divider-v" />
              <button className="popover-action" onClick={handleCopy}>
                <IconCopy size={14} strokeWidth={2} />
                Copy
              </button>
              <div className="popover-divider-v" />
              <button className="popover-action" onClick={handleShare}>
                <IconShare size={14} strokeWidth={2} />
                Share
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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

