"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfettiEffect } from "./ConfettiEffect";
import { Trophy, Frown } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameResultDialogProps {
  open: boolean;
  status: "won" | "lost";
  attempts?: number;
  maxAttempts: number;
  targetWord?: string;
}

export function GameResultDialog({
  open,
  status,
  attempts,
  maxAttempts,
  targetWord,
}: GameResultDialogProps) {
  const router = useRouter();
  const isWin = status === "won";

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-[#e6e8eb] bg-white overflow-hidden"
      >
        {isWin && <ConfettiEffect />}
        <DialogHeader className="relative z-10">
          <div className="mx-auto mb-4">
            {isWin ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#6aaa64] shadow-lg shadow-[#6aaa64]/30">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#787c7e] shadow-lg shadow-[#787c7e]/30">
                <Frown className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center text-2xl font-[var(--font-heading)] font-bold text-[#1a1a1b]">
            {isWin ? "Congratulations!" : "Better Luck Next Time"}
          </DialogTitle>
          <p className="text-center text-[#787c7e] mt-2">
            {isWin
              ? `You guessed the word in ${attempts} of ${maxAttempts} attempts!`
              : "Don't give up — try again tomorrow!"}
          </p>
          {!isWin && targetWord && (
            <p className="mt-3 text-center text-sm text-[#787c7e]">
              The word was{" "}
              <span className="font-bold uppercase tracking-wide text-[#6aaa64]">
                {targetWord}
              </span>
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="relative z-10 mt-4 sm:justify-center">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto font-semibold"
            size="lg"
          >
            Back to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
