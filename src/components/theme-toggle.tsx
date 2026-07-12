"use client";

import { useEffect, useState } from "react";

/** Dark/light theme toggle. Persists to localStorage and flips `.light` on <html>. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const apply = (toLight: boolean) => {
    setLight(toLight);
    document.documentElement.classList.toggle("light", toLight);
    try {
      localStorage.setItem("transitops-theme", toLight ? "light" : "dark");
    } catch {}
  };

  return (
    <div className="inline-flex border-2 border-ink rounded-[4px] overflow-hidden shadow-brutal-sm">
      <button
        type="button"
        onClick={() => apply(false)}
        className={`px-3 py-1.5 text-sm font-bold ${!light ? "bg-brand text-ink" : "bg-panel-2 text-fg-dim"}`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => apply(true)}
        className={`px-3 py-1.5 text-sm font-bold border-l-2 border-ink ${light ? "bg-brand text-ink" : "bg-panel-2 text-fg-dim"}`}
      >
        Light
      </button>
    </div>
  );
}

/** Inline script (runs before paint) to apply the saved theme without a flash. */
export function ThemeScript() {
  const code = `try{if(localStorage.getItem('transitops-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
