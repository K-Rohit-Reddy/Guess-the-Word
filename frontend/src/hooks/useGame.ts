"use client";

import { useState, useCallback, useEffect } from "react";
import {
  gameAPI,
  type GameResponse,
  type LetterResult,
} from "@/lib/api";

export type KeyStatus = "correct" | "present" | "absent" | "unused";

interface GameState {
  gameId: number | null;
  gameData: GameResponse | null;
  currentGuess: string[];
  lockedGreens: Record<number, string>;
  keyboardColors: Record<string, KeyStatus>;
  isSubmitting: boolean;
  error: string | null;
  shakeRow: boolean;
}

// Greens confirmed so far, by position — carried into the next row automatically.
function computeLockedGreens(
  guesses: GameResponse["guesses"]
): Record<number, string> {
  const greens: Record<number, string> = {};
  for (const guess of guesses) {
    for (const letter of guess.letters) {
      if (letter.status === "correct") {
        greens[letter.position] = letter.letter;
      }
    }
  }
  return greens;
}

// Fresh input row: locked greens pre-filled, other slots empty.
function seedGuess(greens: Record<number, string>): string[] {
  return Array.from({ length: 5 }, (_, i) => greens[i] ?? "");
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    gameId: null,
    gameData: null,
    currentGuess: seedGuess({}),
    lockedGreens: {},
    keyboardColors: {},
    isSubmitting: false,
    error: null,
    shakeRow: false,
  });

  const updateKeyboardColors = useCallback(
    (guesses: GameResponse["guesses"]) => {
      const colors: Record<string, KeyStatus> = {};
      for (const guess of guesses) {
        for (const letter of guess.letters) {
          const current = colors[letter.letter];
          if (letter.status === "correct") {
            colors[letter.letter] = "correct";
          } else if (letter.status === "present" && current !== "correct") {
            colors[letter.letter] = "present";
          } else if (!current) {
            colors[letter.letter] = "absent";
          }
        }
      }
      return colors;
    },
    []
  );

  const startNewGame = useCallback(async () => {
    try {
      const res = await gameAPI.start();
      const gameData = await gameAPI.getGame(res.game_id);
      const lockedGreens = computeLockedGreens(gameData.guesses);
      setState({
        gameId: res.game_id,
        gameData,
        currentGuess: seedGuess(lockedGreens),
        lockedGreens,
        keyboardColors: updateKeyboardColors(gameData.guesses),
        isSubmitting: false,
        error: null,
        shakeRow: false,
      });
      return res.game_id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start game";
      setState((s) => ({ ...s, error: msg }));
      throw err;
    }
  }, []);

  const loadGame = useCallback(
    async (gameId: number) => {
      try {
        const gameData = await gameAPI.getGame(gameId);
        const lockedGreens = computeLockedGreens(gameData.guesses);
        const colors = updateKeyboardColors(gameData.guesses);
        setState({
          gameId,
          gameData,
          currentGuess: seedGuess(lockedGreens),
          lockedGreens,
          keyboardColors: colors,
          isSubmitting: false,
          error: null,
          shakeRow: false,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load game";
        setState((s) => ({ ...s, error: msg }));
      }
    },
    [updateKeyboardColors]
  );

  const addLetter = useCallback((letter: string) => {
    setState((s) => {
      if (s.isSubmitting) return s;
      const idx = s.currentGuess.findIndex((c) => !c);
      if (idx === -1) return s; // row full
      const next = [...s.currentGuess];
      next[idx] = letter.toUpperCase();
      return { ...s, currentGuess: next, error: null };
    });
  }, []);

  const removeLetter = useCallback(() => {
    setState((s) => {
      if (s.isSubmitting) return s;
      // Clear the last filled slot that isn't a locked green.
      let idx = -1;
      for (let i = s.currentGuess.length - 1; i >= 0; i--) {
        if (s.currentGuess[i] && s.lockedGreens[i] === undefined) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return s;
      const next = [...s.currentGuess];
      next[idx] = "";
      return { ...s, currentGuess: next, error: null };
    });
  }, []);

  const submitGuess = useCallback(async () => {
    const word = state.currentGuess.join("");
    if (!state.gameId || word.length !== 5 || state.isSubmitting) return;

    setState((s) => ({ ...s, isSubmitting: true, error: null }));

    try {
      const gameData = await gameAPI.guess(state.gameId, word);
      const colors = updateKeyboardColors(gameData.guesses);
      const lockedGreens = computeLockedGreens(gameData.guesses);
      setState((s) => ({
        ...s,
        gameData,
        currentGuess: seedGuess(lockedGreens),
        lockedGreens,
        keyboardColors: colors,
        isSubmitting: false,
        shakeRow: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit guess";
      setState((s) => ({
        ...s,
        isSubmitting: false,
        error: msg,
        shakeRow: true,
      }));
      setTimeout(() => setState((s) => ({ ...s, shakeRow: false })), 600);
    }
  }, [state.gameId, state.currentGuess, state.isSubmitting, updateKeyboardColors]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        removeLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitGuess, removeLetter, addLetter]);

  return {
    ...state,
    startNewGame,
    loadGame,
    addLetter,
    removeLetter,
    submitGuess,
  };
}
