import { useState, useEffect } from 'react';

/**
 * useTypography — Manages font family, size, and line-height for the reader.
 * Persists to localStorage.
 */
export function useTypography() {
  const [typography, setTypography] = useState(() => {
    const saved = localStorage.getItem('typography');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Default typography settings
    return {
      fontFamily: "'Merriweather', serif",
      fontSize: 17,       // px
      lineHeight: 1.6,    // multiplier
    };
  });

  useEffect(() => {
    localStorage.setItem('typography', JSON.stringify(typography));
    
    // Inject the typography variables into the root or body so CSS can use them
    const root = document.documentElement;
    root.style.setProperty('--article-font-family', typography.fontFamily);
    root.style.setProperty('--article-font-size', `${typography.fontSize}px`);
    root.style.setProperty('--article-line-height', typography.lineHeight);
  }, [typography]);

  const setFontFamily = (family) => setTypography(prev => ({ ...prev, fontFamily: family }));
  const setFontSize = (size) => setTypography(prev => ({ ...prev, fontSize: size }));
  const setLineHeight = (lh) => setTypography(prev => ({ ...prev, lineHeight: lh }));

  return {
    typography,
    setFontFamily,
    setFontSize,
    setLineHeight,
  };
}
