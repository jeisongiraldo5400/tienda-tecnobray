'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Campo de búsqueda con debounce. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  delay = 350,
  label = 'Buscar',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  label?: string;
}) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setText(value);
  }
  useEffect(() => {
    if (text === value) return;
    const id = window.setTimeout(() => onChange(text.trim()), delay);
    return () => window.clearTimeout(id);
  }, [text, value, delay, onChange]);
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base focus:border-accent-text focus:outline-none focus:ring-2 focus:ring-accent/40 md:h-10 md:text-sm"
      />
    </label>
  );
}
