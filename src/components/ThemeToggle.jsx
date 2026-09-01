import { IconSun, IconMoon, IconContrast } from '@tabler/icons-react';

const CYCLE = ['light', 'dark', 'sepia'];

const ICONS = {
  light: IconSun,
  dark:  IconMoon,
  sepia: IconContrast,
};

/**
 * ThemeToggle — single cycling icon button.
 * Tapping cycles: light → dark → sepia → light.
 * The icon always reflects the currently resolved theme.
 *
 * Props:
 *   themeMode     "auto" | "light" | "dark" | "sepia"
 *   resolvedTheme "light" | "dark" | "sepia"
 *   setThemeMode  fn(mode)
 */
export default function ThemeToggle({ themeMode, resolvedTheme, setThemeMode }) {
  const current = themeMode === 'auto' ? resolvedTheme : themeMode;
  const Icon = ICONS[current] ?? IconSun;

  const handleCycle = () => {
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setThemeMode(next);
  };

  const labels = { light: 'Switch to dark mode', dark: 'Switch to sepia mode', sepia: 'Switch to light mode' };

  return (
    <button
      className="icon-btn"
      onClick={handleCycle}
      aria-label={labels[current] ?? 'Toggle theme'}
      title={`Theme: ${current}`}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
