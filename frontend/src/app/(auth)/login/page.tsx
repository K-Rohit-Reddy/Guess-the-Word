"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter your username and password");
      return;
    }
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back!");
      // the redirect effect above navigates once `user` is set
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-[#d3d6da] bg-white px-3 py-2.5 text-[#1a1a1b] outline-none placeholder:text-[#9aa0a6] focus:border-[#6aaa64] focus:ring-2 focus:ring-[#6aaa64]/20";

  return (
    <div className="w-full max-w-sm">
      <div className="w-full rounded-2xl border border-[#e6e8eb] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="mb-7 flex flex-col items-center text-center">
          <h1 className="font-[var(--font-heading)] text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[#787c7e]">
            Sign in to play today&apos;s words
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-[#3a3a3c]"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#3a3a3c]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#787c7e] transition-colors hover:text-[#1a1a1b]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6aaa64] py-2.5 font-semibold text-white transition-colors hover:bg-[#5c9656] disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In & Play"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#787c7e]">
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#6aaa64] hover:text-[#5c9656]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
