"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Gamepad2, Trophy, TrendingUp, Activity, Zap, Award, ArrowRight } from "lucide-react";
import { adminAPI, PlatformStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
          Platform Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time statistics and insights for Guess The Word.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">All-Time Statistics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Players"
              value={stats?.total_players}
              icon={Users}
              isLoading={isLoading}
              className="border-t-[#6aaa64]/60 border-t-2"
              iconClassName="text-[#6aaa64] bg-[#6aaa64]/10"
            />
            <StatCard
              title="Total Games"
              value={stats?.total_games}
              icon={Gamepad2}
              isLoading={isLoading}
              className="border-t-violet-500/60 border-t-2"
              iconClassName="text-violet-600 bg-violet-500/10"
            />
            <StatCard
              title="Total Wins"
              value={stats?.total_wins}
              icon={Trophy}
              isLoading={isLoading}
              className="border-t-emerald-500/50 border-t-2"
              iconClassName="text-emerald-500 bg-emerald-500/10"
            />
            <StatCard
              title="Global Win Rate"
              value={stats?.overall_win_rate != null ? `${stats.overall_win_rate.toFixed(1)}%` : undefined}
              icon={TrendingUp}
              isLoading={isLoading}
              className="border-t-blue-500/50 border-t-2"
              iconClassName="text-blue-500 bg-blue-500/10"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">Today's Activity</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Active Players Today"
              value={stats?.active_players_today}
              icon={Activity}
              isLoading={isLoading}
              className="border-t-orange-500/50 border-t-2"
              iconClassName="text-orange-500 bg-orange-500/10"
            />
            <StatCard
              title="Games Played Today"
              value={stats?.games_today}
              icon={Zap}
              isLoading={isLoading}
              className="border-t-yellow-500/50 border-t-2"
              iconClassName="text-yellow-500 bg-yellow-500/10"
            />
            <StatCard
              title="Wins Today"
              value={stats?.wins_today}
              icon={Award}
              isLoading={isLoading}
              className="border-t-cyan-500/50 border-t-2"
              iconClassName="text-cyan-500 bg-cyan-500/10"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">Quick Links</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard href="/admin/daily-report" title="Daily Reports" desc="View day-by-day stats" />
            <QuickLinkCard href="/admin/user-report" title="User Reports" desc="Analyze individual players" />
            <QuickLinkCard href="/admin/users" title="Manage Users" desc="Edit or remove accounts" />
            <QuickLinkCard href="/admin/words" title="Word Dictionary" desc="Manage game vocabulary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  isLoading, 
  className,
  iconClassName 
}: { 
  title: string; 
  value?: string | number; 
  icon: any; 
  isLoading: boolean;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value !== undefined ? value : "-"}</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group h-full bg-card/40 border-border/50">
        <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </div>
          <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary/80">
            View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
