import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'fiq-theme';

function getSystemPref() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStored() {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem(STORAGE_KEY) || 'system';
}

function resolve(mode) {
  return mode === 'system' ? getSystemPref() : mode;
}

export function useTheme() {
  const [mode, setMode] = useState(getStored);
  const [theme, setTheme] = useState(() => resolve(getStored()));

  useEffect(() => {
    const resolved = resolve(mode);
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => setTheme(getSystemPref());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : m === 'light' ? 'system' : 'dark'));
  }, []);

  return { mode, theme, setMode, cycle };
}
