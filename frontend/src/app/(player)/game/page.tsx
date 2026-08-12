"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/hooks/useGame";
import { GameBoard } from "@/components/custom/GameBoard";
import { Keyboard } from "@/components/custom/Keyboard";
import { GameResultDialog } from "@/components/custom/GameResultDialog";
import { ArrowLeft, Loader2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameIdParam = searchParams.get("id");

  const {
    gameId,
    gameData,
    currentGuess,
    lockedGreens,
    keyboardColors,
    isSubmitting,
    error,
    shakeRow,
    startNewGame,
    loadGame,
    addLetter,
    removeLetter,
    submitGuess,
  } = useGame();

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (gameIdParam) {
          await loadGame(parseInt(gameIdParam));
        } else {
          const newId = await startNewGame();
          // Update the URL to include the game id
          window.history.replaceState(null, "", `/game?id=${newId}`);
        }
      } catch {
        toast.error("Failed to initialize game");
        router.push("/dashboard");
      } finally {
        setInitializing(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (initializing || !gameData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Initializing game...
        </p>
      </div>
    );
  }

  const isGameOver = gameData.status === "won" || gameData.status === "lost";

  return (
    <div className="max-w-lg mx-auto flex flex-col min-h-[calc(100vh-8rem)] w-full px-4">
      <div className="flex items-center justify-between w-full mb-2">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 -ml-2 rounded-full text-foreground hover:bg-muted transition-colors"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <Dialog>
          <DialogTrigger
            className="p-2 -mr-2 rounded-full text-foreground hover:bg-muted transition-colors"
            aria-label="Help"
          >
            <Lightbulb className="h-6 w-6" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Play</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Guess the word in 5 tries.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Each guess must be a valid 5-letter word.</li>
                  <li>The color of the tiles will change to show how close your guess was to the word.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Examples</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#6aaa64]/85 border-2 border-[#6aaa64]/60 font-bold text-white shadow-sm text-lg">
                    W
                  </div>
                  <span><strong>W</strong> is in the word and in the correct spot.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#c9b458]/85 border-2 border-[#c9b458]/60 font-bold text-white shadow-sm text-lg">
                    O
                  </div>
                  <span><strong>O</strong> is in the word but in the wrong spot.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#787c7e]/85 border-2 border-[#787c7e]/60 font-bold text-white shadow-sm text-lg">
                    R
                  </div>
                  <span><strong>R</strong> is not in the word in any spot.</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-8 w-full">
        <GameBoard
          guesses={gameData.guesses}
          currentGuess={currentGuess}
          maxAttempts={gameData.max_attempts}
          shakeRow={shakeRow}
          lockedGreens={lockedGreens}
        />

        {/* Keyboard panel */}
        <div className="w-full rounded-xl bg-muted/50 px-3 py-4 flex flex-col items-center">
          <Keyboard
            keyboardColors={keyboardColors}
            onKey={addLetter}
            onEnter={submitGuess}
            onBackspace={removeLetter}
            disabled={isSubmitting || isGameOver}
          />
        </div>
      </div>

      {isGameOver && (
        <GameResultDialog
          open={true}
          status={gameData.status as "won" | "lost"}
          attempts={gameData.guesses.length}
          maxAttempts={gameData.max_attempts}
          targetWord={gameData.word ?? undefined}
        />
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
