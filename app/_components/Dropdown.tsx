"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconCheck } from "./icons";

export type DropdownOption = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function Dropdown({ value, options, onChange, disabled, placeholder = "Select…", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 w-full min-w-[180px] px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm transition-colors hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[var(--primary)]"
      >
        <span className={current ? "text-white truncate" : "text-[var(--muted)]"}>
          {current ? (
            <>
              <span>{current.label}</span>
              {current.hint && <span className="ml-2 text-[var(--muted)] text-xs">{current.hint}</span>}
            </>
          ) : (
            placeholder
          )}
        </span>
        <IconChevronDown
          width={14}
          height={14}
          className={`text-[var(--muted)] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full mt-1.5 right-0 left-0 min-w-full z-50 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[var(--background-soft)] shadow-2xl shadow-black/50 backdrop-blur-xl animate-fade-up"
          style={{ animationDuration: "120ms" }}
        >
          <ul className="p-1.5">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      active
                        ? "bg-[var(--primary)]/15 text-white"
                        : "hover:bg-white/5 text-[var(--foreground)]"
                    }`}
                  >
                    <span className="truncate">
                      <span>{opt.label}</span>
                      {opt.hint && <span className="ml-2 text-[var(--muted)] text-xs">{opt.hint}</span>}
                    </span>
                    {active && <IconCheck width={14} height={14} className="text-[var(--primary)] shrink-0" />}
                  </button>
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-3 text-sm text-[var(--muted)] text-center">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
