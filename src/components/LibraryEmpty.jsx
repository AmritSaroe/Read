import { IconPlus } from '@tabler/icons-react';

/**
 * Library — Empty State — spec §3.1
 *
 * Props:
 *   onAdd  fn()  — opens the AddArticleSheet
 */
export default function LibraryEmpty({ onAdd }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 40px',
      textAlign: 'center',
      /* Vertically centered in the remaining viewport (below the top-bar) */
      minHeight: 'calc(100dvh - 72px)',
    }}>
      {/* Stacked-document glyph — spec §3.1: bg-card fill, border-strong stroke, 60–72px */}
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 20 }}
        aria-hidden="true"
      >
        {/* Back page (offset) */}
        <rect
          x="16" y="10"
          width="36" height="46"
          rx="5"
          fill="var(--bg-card)"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
        />
        {/* Front page */}
        <rect
          x="10" y="16"
          width="36" height="46"
          rx="5"
          fill="var(--bg-card)"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
        />
        {/* Lines on front page */}
        <line x1="18" y1="28" x2="38" y2="28" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="34" x2="38" y2="34" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="40" x2="30" y2="40" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Headline — spec §3.1 */}
      <p style={{
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 10,
        lineHeight: 1.3,
      }}>
        Your library is empty
      </p>

      {/* Body — spec §3.1: 13–14px, text-secondary, max-width ~220–240px */}
      <p style={{
        fontSize: 14,
        fontWeight: 400,
        color: 'var(--text-secondary)',
        maxWidth: 230,
        lineHeight: 1.55,
        marginBottom: 32,
      }}>
        Save an article and it&rsquo;ll show up here, ready to read without the clutter.
      </p>

      {/* CTA button — spec §3.1: accent-fill bg, accent-on text, ti-plus icon */}
      {/* This is the ONLY add-entry-point on this screen — no FAB */}
      <button className="btn-primary" onClick={onAdd}>
        <IconPlus size={16} strokeWidth={2.5} />
        Add your first article
      </button>
    </div>
  );
}
