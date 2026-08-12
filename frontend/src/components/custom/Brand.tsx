import Link from "next/link";
import { cn } from "@/lib/utils";

// Single source of truth for the tile-mark + wordmark, so the landing page and
// both dashboards look identical. Always links home.
export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6aaa64] font-[var(--font-heading)] text-xl font-bold text-white shadow-sm shadow-[#6aaa64]/40">
        W
      </span>
      <span className="font-[var(--font-heading)] text-lg font-bold tracking-tight text-foreground">
        Guess the Word
      </span>
    </Link>
  );
}
