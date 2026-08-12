import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/custom/Brand";

// Shared chrome for /login and /register: same navbar as the landing page and
// the dashboards, plus a way back out.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] text-[#1a1a1b]">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Brand href="/" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#3a3a3c] transition-colors hover:bg-black/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  );
}
