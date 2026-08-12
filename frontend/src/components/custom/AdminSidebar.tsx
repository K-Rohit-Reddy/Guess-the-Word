"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserSearch,
  Users,
  BookType,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/custom/Brand";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/daily-report", label: "Daily Report", icon: CalendarDays },
  { href: "/admin/user-report", label: "User Report", icon: UserSearch },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/words", label: "Words", icon: BookType },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-full flex-col bg-card border-r border-border/50 px-4 py-6">
      <div className="mb-8 px-2">
        <Brand href="/" />
        <p className="text-sm text-muted-foreground mt-2 px-0.5">Admin Dashboard</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant="ghost"
              nativeButton={false}
              render={<Link href={item.href} />}
              className={cn(
                "w-full justify-start gap-3",
                isActive
                  ? "bg-[#6aaa64]/10 text-foreground border-l-2 border-l-[#6aaa64] rounded-l-none"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <Separator className="my-6" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent transition-colors" />
          }
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6aaa64]/10 text-[#6aaa64] font-bold">
            {user?.display_name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.display_name || "Admin"}</span>
            <span className="text-xs text-muted-foreground">{user?.username ? `@${user.username}` : "admin"}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem
            onClick={() => logout()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
