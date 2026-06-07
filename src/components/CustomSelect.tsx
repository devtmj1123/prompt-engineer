"use client";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function CustomSelect({ options, value, onChange, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between th-bg th-inset rounded-xl px-4 py-3 text-sm
          th-text border-none outline-none cursor-pointer text-left
          focus:ring-2 focus:ring-[var(--accent)] transition-all btn-press"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3.5 h-3.5 th-muted transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 th-surface th-raised rounded-xl p-1.5 flex flex-col gap-1 border th-border anim-scale-in">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "th-inset th-accent font-semibold"
                    : "hover:th-surface hover:th-raised th-text"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 th-accent shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
