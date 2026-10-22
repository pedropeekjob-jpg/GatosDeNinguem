"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "gn-favoritos";
const EVENT = "gn-favoritos-change";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Favourite cats, kept on this device only (no account needed). */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = useCallback((slug: string) => {
    const current = read();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* storage unavailable */ }
    setFavorites(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { favorites, toggle, isFavorite: (slug: string) => favorites.includes(slug) };
}
