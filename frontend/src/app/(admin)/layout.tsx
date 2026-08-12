"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/custom/AdminSidebar";
import { Brand } from "@/components/custom/Brand";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 md:block fixed inset-y-0 z-50">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Header */}
        <div className="flex h-16 items-center border-b border-border/50 px-4 md:hidden bg-card">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Admin Menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 p-0 border-r-0">
               <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
              </SheetHeader>
              <div onClick={() => setIsMobileMenuOpen(false)} className="h-full">
                <AdminSidebar />
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-4">
            <Brand href="/" />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
