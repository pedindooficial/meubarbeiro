"use client";

import { useState, useRef, useEffect } from "react";

type Option = { value: string; label: string };

export default function SelectDark({
  value,
  onChange,
  options,
  placeholder = "Selecione",
  label,
  id,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-600 text-left text-white min-h-[44px] flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "" : "text-gray-500"}>{display}</span>
        <span className="text-gray-500 shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul
          className="absolute z-50 mt-1 w-full min-w-[200px] rounded-lg border border-gray-600 bg-gray-900 py-1 shadow-xl max-h-60 overflow-auto"
          role="listbox"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-4 py-3 cursor-pointer min-h-[44px] flex items-center ${
                opt.value === value
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
