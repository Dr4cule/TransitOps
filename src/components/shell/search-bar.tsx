"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchAction } from "@/lib/actions/search";
import type { SearchHit } from "@/lib/queries/search";

const ICON: Record<SearchHit["type"], string> = {
  vehicle: "🚚",
  driver: "🪪",
  trip: "🛣️",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search whenever the query changes.
  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      if (q.length < 2) {
        setHits([]);
        setOpen(false);
        return;
      }
      startTransition(async () => {
        const results = await searchAction(q);
        setHits(results);
        setActive(0);
        setOpen(true);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-sm">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder="Search vehicles, drivers, trips…"
        className="w-full border-2 border-ink bg-panel-2 rounded-[4px] px-3 py-1.5 text-sm text-fg placeholder:text-fg-dim/60 focus:outline-none focus:border-brand focus:shadow-[inset_2px_2px_0_var(--color-brand)]"
      />

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 border-[3px] border-ink bg-panel rounded-[4px] shadow-brutal overflow-hidden">
          {hits.length === 0 ? (
            <div className="px-3 py-3 text-sm text-fg-dim">
              {pending ? "Searching…" : "No matches."}
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto">
              {hits.map((hit, i) => (
                <li key={`${hit.type}-${hit.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left border-b-2 border-ink/15 last:border-b-0 ${
                      i === active ? "bg-brand/25" : ""
                    }`}
                  >
                    <span className="text-base leading-none">{ICON[hit.type]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-fg">
                        {hit.title}
                      </span>
                      <span className="block truncate text-xs text-fg-dim">
                        {hit.subtitle}
                      </span>
                    </span>
                    <span className="label !text-[10px] shrink-0">{hit.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
