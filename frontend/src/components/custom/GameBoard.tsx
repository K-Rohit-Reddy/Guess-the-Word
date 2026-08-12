"use client";

import { Tile } from "./Tile";
import type { GuessResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  guesses: GuessResponse[];
  currentGuess: string[];
  maxAttempts: number;
  shakeRow: boolean;
  lockedGreens: Record<number, string>;
}

export function GameBoard({
  guesses,
  currentGuess,
  maxAttempts,
  shakeRow,
  lockedGreens,
}: GameBoardProps) {
  const rows = [];

  for (let i = 0; i < maxAttempts; i++) {
    if (i < guesses.length) {
      // Completed guess row
      rows.push(
        <div key={i} className="flex gap-1.5 justify-center">
          {guesses[i].letters.map((letter, j) => (
            <Tile
              key={j}
              letter={letter.letter}
              status={letter.status}
              isRevealed={true}
              delay={j * 150}
            />
          ))}
        </div>
      );
    } else if (i === guesses.length) {
      // Current input row
      const firstEmpty = currentGuess.findIndex((c) => !c);
      rows.push(
        <div
          key={i}
          className={cn(
            "flex gap-1.5 justify-center",
            shakeRow && "animate-tile-shake"
          )}
        >
          {Array.from({ length: 5 }).map((_, j) => {
            const isGreen = lockedGreens[j] !== undefined;
            return (
              <Tile
                key={j}
                letter={currentGuess[j]}
                status={isGreen ? "correct" : undefined}
                isRevealed={isGreen}
                isFilled={!!currentGuess[j] && !isGreen}
                isActive={j === firstEmpty}
              />
            );
          })}
        </div>
      );
    } else {
      // Empty future row
      rows.push(
        <div key={i} className="flex gap-1.5 justify-center">
          {Array.from({ length: 5 }).map((_, j) => (
            <Tile key={j} />
          ))}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white/50 p-4 backdrop-blur-md border border-[#e6e8eb] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      {rows}
    </div>
  );
}
