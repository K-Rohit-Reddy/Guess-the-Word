"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { settingsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface ValidationState {
  valid: boolean;
  message: string;
}

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Password feedback waits until a field is left, so nothing flashes mid-typing.
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();

  const debouncedUsername = useDebounce(username, 500);

  // Username validation rules
  const validateUsername = (val: string): ValidationState => {
    if (val.length === 0) return { valid: false, message: "" };
    if (val.length < 5) return { valid: false, message: "At least 5 characters" };
    if (!val.match(/^[a-zA-Z]+$/)) return { valid: false, message: "Letters only" };
    if (val === val.toLowerCase() || val === val.toUpperCase())
      return { valid: false, message: "Mix upper & lowercase" };
    return { valid: true, message: "Format valid" };
  };

  // Password validation rules
  const validatePassword = (val: string): ValidationState[] => {
    const rules: ValidationState[] = [];
    rules.push({ valid: val.length >= 5, message: "At least 5 characters" });
    rules.push({ valid: /[a-zA-Z]/.test(val), message: "Contains a letter" });
    rules.push({ valid: /[0-9]/.test(val), message: "Contains a number" });
    rules.push({ valid: /[$%*]/.test(val), message: "Contains $, %, or *" });
    return rules;
  };

  const usernameValidation = validateUsername(username);
  const passwordRules = validatePassword(password);
  const allPasswordValid = password.length > 0 && passwordRules.every((r) => r.valid);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Check username availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!debouncedUsername || !validateUsername(debouncedUsername).valid) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await settingsAPI.checkUsername(debouncedUsername);
        setUsernameAvailable(res.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };
    checkAvailability();
  }, [debouncedUsername]);

  const canSubmit =
    displayName.trim().length > 0 &&
    usernameValidation.valid &&
    allPasswordValid &&
    passwordsMatch &&
    usernameAvailable === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      await authAPI.register({
        display_name: displayName.trim(),
        username,
        password,
      });
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[#787c7e]">
            Join and start guessing today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-[#3a3a3c]">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="Your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-[#3a3a3c]">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                placeholder="e.g. JohnDoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${inputCls} pr-28`}
                autoComplete="username"
              />
              {username.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <span className="inline-flex items-center rounded-md border border-[#d3d6da] px-2 py-0.5 text-xs text-[#787c7e]">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Checking
                    </span>
                  ) : usernameValidation.valid && usernameAvailable === true ? (
                    <span className="inline-flex items-center rounded-md border border-[#6aaa64]/40 bg-[#6aaa64]/10 px-2 py-0.5 text-xs font-medium text-[#5c9656]">
                      <Check className="mr-1 h-3 w-3" />
                      Available
                    </span>
                  ) : usernameValidation.valid && usernameAvailable === false ? (
                    <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      <X className="mr-1 h-3 w-3" />
                      Taken
                    </span>
                  ) : !usernameValidation.valid && usernameValidation.message ? (
                    <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      <X className="mr-1 h-3 w-3" />
                      Invalid
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            {username.length > 0 && !usernameValidation.valid && usernameValidation.message && (
              <p className="text-xs text-red-600">{usernameValidation.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#3a3a3c]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setTouched((t) => ({ ...t, password: false }))}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className={`${inputCls} pr-11`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#787c7e] transition-colors hover:text-[#1a1a1b]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Requirements are a static hint; pass/fail pills only after blur. */}
            <p className="text-xs text-[#9aa0a6]">
              5+ characters, with a letter, a number, and one of $ % *
            </p>
            {touched.password && password.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {passwordRules.map((rule, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      rule.valid
                        ? "border-[#6aaa64]/40 bg-[#6aaa64]/10 text-[#5c9656]"
                        : "border-[#d3d6da] text-[#9aa0a6]"
                    }`}
                  >
                    {rule.valid ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    {rule.message}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#3a3a3c]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setTouched((t) => ({ ...t, confirmPassword: false }))}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                className={`${inputCls} pr-11`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#787c7e] transition-colors hover:text-[#1a1a1b]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirmPassword && confirmPassword.length > 0 && (
              <p className={`text-xs ${passwordsMatch ? "text-[#5c9656]" : "text-red-600"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6aaa64] py-2.5 font-semibold text-white transition-colors hover:bg-[#5c9656] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#787c7e]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#6aaa64] hover:text-[#5c9656]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
