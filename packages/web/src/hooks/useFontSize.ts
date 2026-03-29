import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "porta:fontSize";
const DEFAULT_SIZE = 14;
const MIN_SIZE = 12;
const MAX_SIZE = 22;
const STEP = 1;

export function useFontSize() {
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!isNaN(parsed) && parsed >= MIN_SIZE && parsed <= MAX_SIZE)
          return parsed;
      }
    } catch {}
    return DEFAULT_SIZE;
  });

  // Apply to DOM — set html font-size directly so all rem units scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    try {
      localStorage.setItem(STORAGE_KEY, String(fontSize));
    } catch {}
  }, [fontSize]);

  const increase = useCallback(() => {
    setFontSize((prev) => Math.min(prev + STEP, MAX_SIZE));
  }, []);

  const decrease = useCallback(() => {
    setFontSize((prev) => Math.max(prev - STEP, MIN_SIZE));
  }, []);

  const reset = useCallback(() => {
    setFontSize(DEFAULT_SIZE);
  }, []);

  return { fontSize, increase, decrease, reset, MIN_SIZE, MAX_SIZE };
}
