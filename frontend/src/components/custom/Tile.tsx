"use client";

import { cn } from "@/lib/utils";
import type { LetterResult } from "@/lib/api";

interface TileProps {
  letter?: string;
  status?: LetterResult["status"];
  isFilled?: boolean;
  isRevealed?: boolean;
  delay?: number;
  isActive?: boolean;
}

export function Tile({
  letter,
  status,
  isFilled,
  isRevealed,
  delay = 0,
  isActive,
}: TileProps) {
  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold uppercase transition-all duration-200 select-none backdrop-blur-sm sm:h-16 sm:w-16",
        // Empty state
        !letter && !status && "border-[#d3d6da] bg-white/40 text-[#1a1a1b]",
        // Filled but not revealed
        isFilled && !isRevealed && "border-[#9aa0a6] bg-white/70 text-[#1a1a1b] animate-tile-pop",
        // Active input position
        isActive && "border-[#787c7e]",
        // Revealed states — tinted frosted glass, grey/yellow/green only
        isRevealed && status === "correct" &&
          "animate-tile-flip border-[#6aaa64]/60 bg-[#6aaa64]/85 text-white",
        isRevealed && status === "present" &&
          "animate-tile-flip border-[#c9b458]/60 bg-[#c9b458]/85 text-white",
        isRevealed && status === "absent" &&
          "animate-tile-flip border-[#787c7e]/60 bg-[#787c7e]/85 text-white"
      )}
      style={{
        animationDelay: isRevealed ? `${delay}ms` : undefined,
        animationFillMode: isRevealed ? "backwards" : undefined,
      }}
    >
      {letter || ""}
    </div>
  );
}
