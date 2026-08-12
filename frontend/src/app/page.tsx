"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/custom/Brand";
import { Tile } from "@/components/custom/Tile";
import type { LetterResult } from "@/lib/api";

const MAX_GUESSES = 5;
const FRAME_MS = 1100;

type DemoRow = { l: string; s: LetterResult["status"] }[];

// g = correct, y = present, . = absent
const row = (word: string, pattern: string): DemoRow =>
  word.split("").map((l, i) => ({
    l,
    s:
      pattern[i] === "g" ? "correct" : pattern[i] === "y" ? "present" : "absent",
  }));

// Two demo games on a loop: one solved on the fourth try, one that burns all
// five guesses and still lands a letter short.
const DEMO_GAMES: DemoRow[][] = [
  // MOUSE — won
  [
    row("CRANE", "....g"),
    row("SLOTH", "y.y.."),
    row("HOUSE", ".gggg"),
    row("MOUSE", "ggggg"),
  ],
  // WATCH — out of guesses
  [
    row("CRANE", "y.y.."),
    row("CHALK", "yyy.."),
    row("MATCH", ".gggg"),
    row("BATCH", ".gggg"),
    row("LATCH", ".gggg"),
  ],
];

// One frame per tick: empty board, then a guess at a time, then a beat to hold
// the finished board before the next game starts.
const FRAMES: [number, number][] = DEMO_GAMES.flatMap((rows, gi) => [
  [gi, 0] as [number, number],
  ...rows.map((_, i): [number, number] => [gi, i + 1]),
  [gi, rows.length] as [number, number],
]);

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setFrame((f) => (f + 1) % FRAMES.length),
      FRAME_MS
    );
    return () => clearInterval(id);
  }, []);

  const [gameIdx, shown] = FRAMES[frame];
  const rows = DEMO_GAMES[gameIdx];
  const homeHref = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbfcfb] text-[#1a1a1b]">
      {/* Layered wash: green from the top-left, a warm accent top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[95vh]"
        style={{
          background: [
            "radial-gradient(58% 50% at 15% -5%, rgba(106,170,100,0.55) 0%, rgba(106,170,100,0.16) 46%, rgba(106,170,100,0) 74%)",
            "radial-gradient(50% 45% at 90% 5%, rgba(201,180,88,0.32) 0%, rgba(201,180,88,0) 68%)",
            "linear-gradient(180deg, rgba(106,170,100,0.18) 0%, rgba(255,255,255,0) 58%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#fbfcfb] to-transparent"
      />

      {/* Top bar */}
      <header className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur">
        {/* Same container as the dashboard Navbar so the brand lands identically */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Brand href="/" />
          <nav className="flex items-center gap-2">
            {loading ? null : user ? (
              <Link
                href={homeHref}
                className="rounded-lg bg-[#6aaa64] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5c9656]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[#3a3a3c] transition-colors hover:bg-black/5"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[#6aaa64] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5c9656]"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero — two columns on desktop so the CTA stays above the fold */}
      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:min-h-[calc(100vh-4rem)] md:grid-cols-2 md:gap-8 md:py-0">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <span className="inline-flex items-center rounded-full border border-[#6aaa64]/30 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-[#4e7a48] uppercase backdrop-blur">
            Three games a day
          </span>

          <h1 className="mt-6 font-[var(--font-heading)] text-4xl font-bold tracking-tight sm:text-5xl">
            One word. Five tries.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#5f6368]">
            Green means the letter is in the right spot, yellow means it&apos;s
            in the word somewhere, grey means it&apos;s out. Three puzzles a
            day, so make every guess count.
          </p>

          <Link
            href={user ? homeHref : "/login"}
            className="group mt-9 inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-[#7cb877] to-[#5c9656] px-9 py-4 text-lg font-semibold text-white ring-1 ring-white/25 ring-inset shadow-[0_12px_30px_-8px_rgba(106,170,100,0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-10px_rgba(106,170,100,0.85)] active:translate-y-0"
          >
            Play Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-sm text-[#9aa0a6]">
            Free to play. No download.
          </p>
        </div>

        {/* Self-playing demo board */}
        <div className="flex justify-center md:justify-end">
          <div className="rounded-2xl border border-black/5 bg-white/60 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: MAX_GUESSES }).map((_, r) => (
                <div key={r} className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const cell = r < shown ? rows[r][i] : null;
                    return cell ? (
                      <Tile
                        key={`${gameIdx}-${r}-${i}`}
                        letter={cell.l}
                        status={cell.s}
                        isRevealed
                        delay={i * 90}
                      />
                    ) : (
                      <Tile key={`empty-${r}-${i}`} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
