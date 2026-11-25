"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

const STORAGE_KEY = "lumensub.theme";

/**
 * Runs before React hydrates (see layout.tsx) so the page never flashes the
 * wrong theme. Kept as a string because it is injected verbatim.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore blocked storage
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      aria-pressed={dark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-muted hover:text-fg"
    >
      {dark ? (
        <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
          <path d="M10 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-5a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM5 10a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm5 5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Z" />
        </svg>
      ) : (
        <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
          <path d="M17.3 13.4A7.5 7.5 0 0 1 6.6 2.7a7.5 7.5 0 1 0 10.7 10.7Z" />
        </svg>
      )}
    </button>
  );
}
