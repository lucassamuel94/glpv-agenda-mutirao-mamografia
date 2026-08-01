"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Categorias de emojis mais comuns
const EMOJI_CATEGORIES = {
  "Frequentemente Usados": [
    "😀",
    "😂",
    "❤️",
    "👍",
    "😊",
    "🙏",
    "😍",
    "😭",
    "🥰",
    "😘",
  ],
  "Sorrisos e Emoções": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
  ],
  Gestos: [
    "👋",
    "🤚",
    "🖐",
    "✋",
    "🖖",
    "👌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
  ],
  Corações: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
  ],
  Objetos: [
    "⌚",
    "📱",
    "📲",
    "💻",
    "⌨️",
    "🖥",
    "🖨",
    "🖱",
    "🖲",
    "🕹",
    "🗜",
    "💾",
    "💿",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📽",
    "🎞",
    "📞",
  ],
  Símbolos: [
    "❤️",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
    "✝️",
    "☪️",
    "🕉",
  ],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onSelect,
  onClose,
  className,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    Object.keys(EMOJI_CATEGORIES)[0]
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filtra emojis baseado na busca
  const filteredEmojis = React.useMemo(() => {
    if (!search.trim()) {
      return (
        EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || []
      );
    }

    // Busca em todos os emojis
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    // Para busca simples, retorna todos (pode ser melhorado com uma biblioteca de emojis)
    return allEmojis;
  }, [search, activeCategory]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose?.();
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "absolute bottom-full left-0 mb-2 w-[320px] bg-card dark:bg-card rounded-xl shadow-2xl border border-border dark:border-border overflow-hidden animate-fadeIn z-50",
        className
      )}
    >
      {/* Header com busca */}
      <div className="p-3 border-b border-border dark:border-border bg-secondary dark:bg-background">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground"
          />
          <input
            ref={searchRef}
            type="text"
            className="w-full bg-card dark:bg-secondary border border-border dark:border-border rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary dark:focus:border-primary text-foreground dark:text-foreground"
            placeholder="Buscar emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categorias */}
      {!search && (
        <div className="flex border-b border-border dark:border-border bg-secondary dark:bg-background overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                activeCategory === category
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Grid de emojis */}
      <div className="p-3 max-h-[280px] overflow-y-auto">
        {filteredEmojis.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground dark:text-muted-foreground">
            Nenhum emoji encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-secondary dark:hover:bg-accent transition-colors cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
