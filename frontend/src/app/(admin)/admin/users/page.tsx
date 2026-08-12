"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Search, UserCog, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { adminAPI, type UserListItem } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" });

  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", username: "", role: "player", password: "" });

  const [deleteUserTarget, setDeleteUserTarget] = useState<UserListItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getUsers({
        search: debouncedSearch || undefined,
        sort_by: sortConfig.key === "display_name" ? "name" : sortConfig.key === "total_games" ? "games" : sortConfig.key === "total_wins" ? "wins" : sortConfig.key,
        order: sortConfig.direction,
      });
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sortConfig]);

  const filteredUsers = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortIcon = (key: string) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : "";

  const openEditDialog = (user: UserListItem) => {
    setEditUser(user);
    setEditForm({ display_name: user.display_name, username: user.username, role: user.role, password: "" });
    setIsEditDialogOpen(true);
  };

  const submitEdit = async () => {
    if (!editUser) return;
    try {
      const updates: Record<string, string> = {
        display_name: editForm.display_name,
        username: editForm.username,
        role: editForm.role,
      };
      if (editForm.password) updates.password = editForm.password;
      await adminAPI.updateUser(editUser.id, updates);
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserTarget) return;
    try {
      await adminAPI.deleteUser(deleteUserTarget.id);
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-heading)] font-bold tracking-tight bg-gradient-to-r from-[#6aaa64] to-[#4e9048] bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">View, edit, and manage platform users.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#6aaa64]/30 bg-[#6aaa64]/10 px-4 py-1.5 text-sm font-medium text-[#4e7a48]">
          <UserCog className="h-4 w-4" />
          <span className="font-bold tabular-nums">{filteredUsers.length}</span>
          {filteredUsers.length === 1 ? "user" : "users"}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="player">Players</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50 bg-card/40 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="cursor-pointer" onClick={() => handleSort("display_name")}>Name{sortIcon("display_name")}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("username")}>Username{sortIcon("username")}</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("total_games")}>Games{sortIcon("total_games")}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("total_wins")}>Wins{sortIcon("total_wins")}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("win_rate")}>Win %{sortIcon("win_rate")}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>Joined{sortIcon("created_at")}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#6aaa64]" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {user.display_name.charAt(0).toUpperCase()}
                        </div>
                        {user.display_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">@{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className={user.role === "admin" ? "bg-violet-600/90 text-white" : ""}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{user.total_games}</TableCell>
                    <TableCell className="text-right text-emerald-500 font-medium">{user.total_wins}</TableCell>
                    <TableCell className="text-right">{user.win_rate.toFixed(1)}%</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            render={
                              <Link href="/admin/user-report"><UserCog className="mr-2 h-4 w-4" /> View Report</Link>
                            }
                          />
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setDeleteUserTarget(user); setIsDeleteDialogOpen(true); }} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Modify user details or reset password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input value={editForm.display_name} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({ ...editForm, role: val || "player" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">player</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password (optional)</label>
              <Input type="password" placeholder="Leave blank to keep current" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteUserTarget?.display_name} (@{deleteUserTarget?.username})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
