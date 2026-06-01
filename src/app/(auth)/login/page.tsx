"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/lands");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass p-8 animate-slide-up">
      {/* Logo & Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
          }}
        >
          <span className="text-3xl">🌱</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Welcome Back
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Sign in to manage your farm
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="mb-6 p-3 rounded-lg text-sm animate-fade-in"
          style={{
            background: "rgba(239, 83, 80, 0.1)",
            border: "1px solid rgba(239, 83, 80, 0.3)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="input-label">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            className="input-field"
            placeholder="farmer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="input-label">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="input-field pr-12"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-muted)" }}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-full btn-lg"
          id="login-submit"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline transition-colors"
            style={{ color: "var(--color-primary-light)" }}
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
