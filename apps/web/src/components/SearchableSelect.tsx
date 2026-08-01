"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { Button } from "./Button";

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className = "",
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        scrollIntoView(activeIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        scrollIntoView(activeIndex - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onChange(filteredOptions[activeIndex].value);
          setIsOpen(false);
          setSearch("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const scrollIntoView = (index: number) => {
    if (listRef.current) {
      const element = listRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div
      className={`relative ${className}`}
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className={`w-full h-10 bg-card dark:bg-secondary border border-border dark:border-border rounded-lg px-3 text-sm flex justify-between items-center cursor-pointer transition-all ${
          isOpen
            ? "ring-2 ring-ring border-primary"
            : "hover:border-primary dark:hover:border-primary"
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch("");
          setActiveIndex(-1);
        }}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-foreground dark:text-foreground font-medium"
              : "text-muted-foreground dark:text-muted-foreground"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-1">
          {selectedOption && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="icon-sm"
              className="p-0.5"
            >
              <X size={14} />
            </Button>
          )}
          <ChevronDown
            size={16}
            className="text-muted-foreground dark:text-muted-foreground"
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-card dark:bg-card rounded-lg shadow-2xl border border-border dark:border-border overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-border dark:border-border bg-secondary dark:bg-background sticky top-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground"
              />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-card dark:bg-secondary border border-border dark:border-border rounded-md pl-8 pr-3 py-2 text-xs outline-none focus:border-primary dark:focus:border-primary text-foreground dark:text-foreground"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground dark:text-muted-foreground">
                Nenhum resultado.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-md cursor-pointer flex justify-between items-center text-sm transition-colors ${
                    option.value === value
                      ? "bg-primary/10 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold"
                      : activeIndex === filteredOptions.indexOf(option)
                      ? "bg-accent dark:bg-secondary text-foreground dark:text-foreground"
                      : "hover:bg-secondary dark:hover:bg-accent text-foreground dark:text-muted-foreground"
                  }`}
                  onMouseEnter={() =>
                    setActiveIndex(filteredOptions.indexOf(option))
                  }
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate">{option.label}</span>
                    {option.subtitle && (
                      <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-normal truncate">
                        {option.subtitle}
                      </span>
                    )}
                  </div>
                  {option.value === value && (
                    <Check size={14} className="flex-shrink-0 ml-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
