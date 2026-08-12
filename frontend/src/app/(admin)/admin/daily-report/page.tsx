"use client";

import { useState, useEffect } from "react";
import { Users, Gamepad2, CheckCircle2, TrendingUp, Search } from "lucide-react";
import { adminAPI, type DailyReport } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function DailyReportPage() {
  const [reportType, setReportType] = useState<"single" | "range">("single");
  const [singleDate, setSingleDate] = useState(todayStr());
  const [fromDate, setFromDate] = useState(daysAgoStr(7));
  const [toDate, setToDate] = useState(todayStr());

  const [singleData, setSingleData] = useState<DailyReport | null>(null);
  const [rangeData, setRangeData] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const fetchSingleReport = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getDailyReport(singleDate);
      setSingleData(data);
    } catch {
      setSingleData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRangeReport = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getDailyRange(fromDate, toDate);
      setRangeData(data);
    } catch {
      setRangeData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === "single") fetchSingleReport();
    else fetchRangeReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...rangeData].sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[key];
      const vb = (b as unknown as Record<string, unknown>)[key];
      if (va! < vb!) return direction === "asc" ? -1 : 1;
      if (va! > vb!) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setRangeData(sorted);
  };

  const sortIcon = (key: string) =>
    sortConfig?.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
          Daily Reports
        </h1>
        <p className="text-muted-foreground mt-2">Analyze player activity and performance over time.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="flex rounded-md shadow-sm" role="group">
          <Button variant={reportType === "single" ? "default" : "outline"} className="rounded-r-none" onClick={() => setReportType("single")}>
            Single Day
          </Button>
          <Button variant={reportType === "range" ? "default" : "outline"} className="rounded-l-none" onClick={() => setReportType("range")}>
            Date Range
          </Button>
        </div>

        {reportType === "single" ? (
          <div className="flex gap-2 items-center">
            <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} className="w-auto" />
            <Button onClick={fetchSingleReport} disabled={isLoading} variant="secondary">
              <Search className="h-4 w-4 mr-2" /> View
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto" />
            <Button onClick={fetchRangeReport} disabled={isLoading} variant="secondary">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6aaa64]" />
        </div>
      ) : reportType === "single" ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Report for {singleDate}</h2>
            {singleData && singleData.total_users > 0 ? (
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Active Data</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">No Activity</Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{singleData?.total_users ?? 0}</div></CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Games</CardTitle>
                <Gamepad2 className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{singleData?.total_games ?? 0}</div></CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Correct Guesses</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{singleData?.total_correct_guesses ?? 0}</div></CardContent>
            </Card>
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#6aaa64]" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{singleData?.win_rate?.toFixed(1) ?? 0}%</div></CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/50 bg-card/40 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("date")}>Date{sortIcon("date")}</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("total_users")}>Users{sortIcon("total_users")}</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("total_games")}>Games{sortIcon("total_games")}</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("total_correct_guesses")}>Correct{sortIcon("total_correct_guesses")}</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("win_rate")}>Win Rate{sortIcon("win_rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rangeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No data found for this date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  rangeData.map((row) => (
                    <TableRow key={row.date} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell>{row.total_users}</TableCell>
                      <TableCell>{row.total_games}</TableCell>
                      <TableCell className="text-emerald-500 font-medium">{row.total_correct_guesses}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={row.win_rate > 50 ? "border-emerald-500/50 text-emerald-500" : ""}>
                          {row.win_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
