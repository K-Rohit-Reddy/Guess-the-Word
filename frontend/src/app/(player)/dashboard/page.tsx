"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { gameAPI, type PlayerStats, type GameHistoryItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gamepad2, Trophy, TrendingUp, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Mirrors MAX_DAILY_GAMES in the backend game service.
const MAX_DAILY_GAMES = 3;

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          gameAPI.getStats(),
          gameAPI.getHistory(),
        ]);
        setStats(statsData);
        setHistory(historyData);
        // An unfinished game still holds a daily slot but is hidden from
        // history — surface it so the player can resume instead of being locked out.
        try {
          const current = await gameAPI.getCurrent();
          setCurrentGameId(current.game_id);
        } catch {
          // 404 = no active game; nothing to resume.
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayGame = async () => {
    // Resume an unfinished game if one exists — it already holds a daily slot.
    if (currentGameId !== null) {
      router.push(`/game?id=${currentGameId}`);
      return;
    }
    if (stats?.games_remaining_today === 0) return;

    setIsStartingGame(true);
    try {
      const response = await gameAPI.start();
      router.push(`/game?id=${response.game_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start game");
      setIsStartingGame(false);
    }
  };

  const statCards = [
    { label: "Total Games", value: stats?.total_games ?? 0, icon: Gamepad2, color: "text-[#6aaa64]" },
    { label: "Total Wins", value: stats?.total_wins ?? 0, icon: Trophy, color: "text-[#c9b458]" },
    { label: "Win Rate", value: `${(stats?.win_rate ?? 0).toFixed(1)}%`, icon: TrendingUp, color: "text-[#6aaa64]" },
    { label: "Current Streak", value: stats?.current_streak ?? 0, icon: Flame, color: "text-orange-500" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight text-foreground">
            Welcome back, {user?.display_name}!
          </h1>
          <p className="text-muted-foreground mt-1">@{user?.username}</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <Button
            size="lg"
            className="w-full md:w-auto h-12 px-8 text-base font-semibold shadow-lg shadow-[#6aaa64]/25 hover:shadow-xl hover:shadow-[#6aaa64]/30 hover:-translate-y-0.5 transition-all"
            onClick={handlePlayGame}
            disabled={
              isStartingGame ||
              (currentGameId === null && stats?.games_remaining_today === 0)
            }
          >
            {isStartingGame ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Gamepad2 className="mr-2 h-5 w-5" />
            )}
            {currentGameId !== null ? "Resume Game" : "Play Game"}
          </Button>
          {stats && (
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                stats.games_remaining_today === 0
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-[#6aaa64]/40 bg-[#6aaa64]/10 text-[#4e7a48]"
              }`}
            >
              {/* One dot per daily slot: filled = still available. */}
              <span className="flex items-center gap-1">
                {Array.from({ length: MAX_DAILY_GAMES }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i < stats.games_remaining_today
                        ? "bg-[#6aaa64]"
                        : "bg-current opacity-30"
                    }`}
                  />
                ))}
              </span>
              {stats.games_remaining_today === 0 ? (
                "No games left today"
              ) : (
                <span>
                  <span className="font-bold tabular-nums">
                    {stats.games_remaining_today}
                  </span>{" "}
                  of {MAX_DAILY_GAMES} games left today
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            className="relative overflow-hidden group border-border bg-card hover:border-[#6aaa64]/40 transition-all"
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <stat.icon
                className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-25 transition-transform group-hover:scale-110 group-hover:opacity-40 ${stat.color}`}
              />
              <div className="text-3xl sm:text-4xl font-black mb-2 animate-count-up">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Game History</h2>
        <Card className="border-border bg-card overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No completed games yet. Click Play Game to start!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Guesses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((game) => (
                    <TableRow key={game.game_id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-foreground">
                        {new Date(game.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={game.status === "won" ? "default" : "destructive"}
                          className={
                            game.status === "won"
                              ? "bg-correct/20 text-correct border-correct/30 hover:bg-correct/30"
                              : ""
                          }
                        >
                          {game.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {game.attempts}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {game.guesses.map((guess, gIdx) => (
                            <div
                              key={gIdx}
                              className={`flex gap-0.5 ${gIdx > 0 ? "border-l border-border pl-1.5" : ""}`}
                            >
                              {guess.letters.map((letter, lIdx) => (
                                <div
                                  key={lIdx}
                                  className={`w-2 h-2 rounded-full ${
                                    letter.status === "correct"
                                      ? "bg-correct"
                                      : letter.status === "present"
                                      ? "bg-present"
                                      : "bg-absent"
                                  }`}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
