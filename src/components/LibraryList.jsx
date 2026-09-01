import { useState } from 'react';
import { IconPlus, IconSettings, IconTrash } from '@tabler/icons-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

/**
 * Library — Populated State
 *
 * Props:
 *   articles      Article[]
 *   onOpen        fn(article)
 *   onDelete      fn(id)
 *   onAdd         fn()
 *   onSettings    fn()
 */

function estimateReadTime(text) {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ── Swipeable article row ──────────────────────────────────────────────────
const DELETE_THRESHOLD = -80; // px left to trigger delete commit

function SwipeableRow({ article, onOpen, onDelete, isLast }) {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOpacity = useTransform(x, [-120, -20], [1, 0]);
  const deleteScale   = useTransform(x, [-120, -20], [1, 0.8]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      // Committed — fly row off-screen, then collapse and delete
      animate(x, -500, { duration: 0.22, ease: 'easeIn' }).then(() => {
        setIsDeleting(true);
      });
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <AnimatePresence onExitComplete={() => onDelete(article.id)}>
      {!isDeleting && (
        <motion.div
          key={article.id}
          initial={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Red delete zone behind the row */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0,
              width: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E53935',
              opacity: deleteOpacity,
              scale: deleteScale,
            }}
          >
            <IconTrash size={20} strokeWidth={2} color="#fff" />
          </motion.div>

          {/* Draggable foreground row */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -120, right: 0 }}
            dragElastic={{ left: 0.12, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{
              x,
              backgroundColor: 'var(--bg-page)',
              position: 'relative',
              zIndex: 1,
              touchAction: 'pan-y',
              cursor: 'grab',
            }}
          >
            <button
              onClick={() => onOpen(article)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 44, height: 56, flexShrink: 0,
                borderRadius: 6,
                backgroundColor: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {article.thumbnail ? (
                  <img src={article.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="3" y="2" width="11" height="14" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.25" />
                    <rect x="6" y="5" width="11" height="14" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.25" />
                    <line x1="8" y1="9"  x2="14" y2="9"  stroke="var(--border-strong)" strokeWidth="1" strokeLinecap="round" />
                    <line x1="8" y1="12" x2="12" y2="12" stroke="var(--border-strong)" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, fontWeight: 500,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 4, lineHeight: 1.3,
                }}>
                  {article.title}
                </p>
                <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1 }}>
                  {article.siteName || extractDomain(article.originalUrl)} · {estimateReadTime(article.textContent)} min
                </p>
              </div>
            </button>
          </motion.div>

          {!isLast && <div className="divider" />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main list ──────────────────────────────────────────────────────────────
export default function LibraryList({
  articles, onOpen, onDelete, onAdd, onSettings,
  themeMode, resolvedTheme, setThemeMode, themeSubtext,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="top-bar">
        <span className="top-bar-title">Library</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ThemeToggle themeMode={themeMode} resolvedTheme={resolvedTheme} setThemeMode={setThemeMode} />
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            <IconSettings size={18} strokeWidth={2} />
          </button>
          <button className="icon-btn" onClick={onAdd} aria-label="Add article">
            <IconPlus size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="divider" />

      {articles.map((article, idx) => (
        <SwipeableRow
          key={article.id}
          article={article}
          onOpen={onOpen}
          onDelete={onDelete}
          isLast={idx === articles.length - 1}
        />
      ))}
    </div>
  );
}



