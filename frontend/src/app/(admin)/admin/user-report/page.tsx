"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Gamepad2, Trophy, TrendingUp, User, CalendarDays, ArrowLeft } from "lucide-react";
import { adminAPI, type UserReport, type UserReportEntry, type UserListItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function UserReportPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [report, setReport] = useState<UserReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserReportEntry; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load the full roster once so the page shows a browsable table instead of a blank state.
  useEffect(() => {
    adminAPI.getUsers().then(setAllUsers).catch(() => setAllUsers([]));
  }, []);

  // Debounced user search
  useEffect(() => {
    const fetchUsers = async () => {
      if (search.length < 1) { setUsers([]); return; }
      try {
        const result = await adminAPI.getUsers({ search });
        setUsers(result);
        setIsDropdownOpen(true);
      } catch { setUsers([]); }
    };
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchUserReport = async () => {
    if (!selectedUser) return;
    setIsLoadingReport(true);
    try {
      const data = await adminAPI.getUserReport(selectedUser.id, fromDate || undefined, toDate || undefined);
      setReport(data);
      setSortConfig(null);
    } catch {
      setReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedUser) fetchUserReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const handleSelectUser = (u: UserListItem) => {
    setSelectedUser(u);
    setSearch("");
    setIsDropdownOpen(false);
  };

  // Roster table filters on the same search box used for the type-ahead.
  const rosterFiltered = allUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.display_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  });

  const handleSort = (key: keyof UserReportEntry) => {
    if (!report) return;
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...report.entries].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setReport({ ...report, entries: sorted });
  };

  const sortIcon = (key: string) =>
    sortConfig?.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
          User Report
        </h1>
        <p className="text-muted-foreground mt-2">View detailed performance history for specific players.</p>
      </div>

      {/* User Search */}
      <div className="bg-card p-6 rounded-xl border border-border/50 relative z-10" ref={dropdownRef}>
        <div className="max-w-md w-full relative">
          <label className="text-sm font-medium mb-2 block">Search Player</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (users.length > 0) setIsDropdownOpen(true); }}
            />
          </div>

          {isDropdownOpen && users.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border/50 rounded-md shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => handleSelectUser(u)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {u.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{u.display_name}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Browsable roster — fills the page before a player is picked */}
      {!selectedUser && (
        <Card className="border-border/50 bg-card/40 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">All Players</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {allUsers.length === 0 ? "Loading players…" : `No players matching "${search}".`}
                    </TableCell>
                  </TableRow>
                ) : (
                  rosterFiltered.map((u) => (
                    <TableRow
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {u.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{u.display_name}</div>
                            <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{u.total_games}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-500 font-medium">{u.total_wins}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.win_rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {selectedUser && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedUser(null); setReport(null); }}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            All players
          </Button>
          {/* User Profile Card */}
          <Card className="bg-card/40 border-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6aaa64] text-white font-bold text-2xl shadow-lg">
                    {selectedUser.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.display_name}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground mt-1">
                      <span className="flex items-center text-sm"><User className="mr-1 h-3 w-3" /> @{selectedUser.username}</span>
                      {selectedUser.created_at && (
                        <span className="flex items-center text-sm">
                          <CalendarDays className="mr-1 h-3 w-3" /> Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                        </span>
                      )}
                      <Badge variant="outline">{selectedUser.role}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center bg-background/50 p-2 rounded-lg border border-border/50">
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-sm" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" onClick={fetchUserReport} disabled={isLoadingReport}>Apply</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingReport ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#6aaa64]" />
            </div>
          ) : report ? (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Games</CardTitle>
                    <Gamepad2 className="h-4 w-4 text-violet-600" />
                  </CardHeader>
                  <CardContent><div className="text-3xl font-bold">{report.total_games}</div></CardContent>
                </Card>
                <Card className="bg-card/40 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Wins</CardTitle>
                    <Trophy className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent><div className="text-3xl font-bold">{report.total_wins}</div></CardContent>
                </Card>
                <Card className="bg-card/40 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-[#6aaa64]" />
                  </CardHeader>
                  <CardContent><div className="text-3xl font-bold">{report.win_rate.toFixed(1)}%</div></CardContent>
                </Card>
              </div>

              {/* History Table */}
              <Card className="border-border/50 bg-card/40 overflow-hidden">
                <CardHeader><CardTitle className="text-lg">Activity History</CardTitle></CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("date")}>Date{sortIcon("date")}</TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("words_tried")}>Words Tried{sortIcon("words_tried")}</TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("correct_guesses")}>Wins{sortIcon("correct_guesses")}</TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("win_rate")}>Win Rate{sortIcon("win_rate")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No activity found for this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.entries.map((row) => (
                          <TableRow key={row.date} className="hover:bg-accent/50 transition-colors">
                            <TableCell className="font-medium">{row.date}</TableCell>
                            <TableCell>{row.words_tried}</TableCell>
                            <TableCell className="text-emerald-500 font-medium">{row.correct_guesses}</TableCell>
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
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
