import { useState, useEffect, useCallback } from "react";

export type ThemeName = "dark" | "light" | "pastel" | "rainbow" | "slate";

const THEMES: ThemeName[] = ["dark", "light", "pastel", "rainbow", "slate"];
const STORAGE_KEY = "porta:theme";

const THEME_ICONS: Record<ThemeName, string> = {
  dark: "🌙",
  light: "☀️",
  pastel: "🌸",
  rainbow: "🌈",
  slate: "◼",
};

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  // Remove all theme classes
  for (const t of THEMES) {
    if (t !== "dark") root.classList.remove(`theme-${t}`);
  }
  // Add new theme class (dark is default, no class needed)
  if (theme !== "dark") {
    root.classList.add(`theme-${theme}`);
  }
}

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored as ThemeName)) {
      return stored as ThemeName;
    }
  } catch {}
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  // Apply theme class on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev);
      return THEMES[(idx + 1) % THEMES.length];
    });
  }, []);

  return { theme, cycleTheme, icon: THEME_ICONS[theme] };
}
