"use client";

import { cn } from "@/lib/utils";
import { Delete, CornerDownLeft } from "lucide-react";
import type { KeyStatus } from "@/hooks/useGame";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

interface KeyboardProps {
  keyboardColors: Record<string, KeyStatus>;
  onKey: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function Keyboard({
  keyboardColors,
  onKey,
  onEnter,
  onBackspace,
  disabled,
}: KeyboardProps) {
  const getKeyColor = (key: string) => {
    const status = keyboardColors[key];
    switch (status) {
      case "correct":
        return "bg-[#6aaa64]/85 border-[#6aaa64]/60 text-white hover:bg-[#6aaa64]/95";
      case "present":
        return "bg-[#c9b458]/85 border-[#c9b458]/60 text-white hover:bg-[#c9b458]/95";
      case "absent":
        return "bg-[#787c7e]/80 border-[#787c7e]/50 text-white hover:bg-[#787c7e]/90";
      default:
        return "bg-white/60 border-[#d3d6da] text-[#1a1a1b] hover:bg-white/90";
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5 mt-4">
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 sm:gap-1.5">
          {row.map((key) => {
            const isSpecial = key === "ENTER" || key === "BACKSPACE";
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === "ENTER") onEnter();
                  else if (key === "BACKSPACE") onBackspace();
                  else onKey(key);
                }}
                disabled={disabled}
                className={cn(
                  "flex items-center justify-center rounded-md border font-semibold transition-all duration-150 active:scale-95 select-none backdrop-blur-sm",
                  isSpecial
                    ? "h-12 px-3 text-xs sm:h-14 sm:px-4 sm:text-sm bg-white/60 border-[#d3d6da] text-[#1a1a1b] hover:bg-white/90"
                    : "h-12 w-8 text-sm sm:h-14 sm:w-10 sm:text-base",
                  !isSpecial && getKeyColor(key),
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {key === "ENTER" ? (
                  <CornerDownLeft className="h-5 w-5" />
                ) : key === "BACKSPACE" ? (
                  <Delete className="h-5 w-5" />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
