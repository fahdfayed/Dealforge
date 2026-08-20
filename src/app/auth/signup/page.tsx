"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signupAction } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Security: warn if credentials are in URL (they shouldn't be)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.has("password") || params.has("confirmPassword") || params.has("email")) {
      console.warn("Security: Credentials should never be passed via URL. Use form submission with POST instead.");
      // Clean URL to remove sensitive data from history/logs
      window.history.replaceState({}, document.title, "/auth/signup");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!email || !name || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await signupAction(email, name, password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/intelloger-logo.svg"
              alt="Intelloger"
              width={120}
              height={120}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign up</h1>
          <p className="text-slate-500 mb-8">Create your Intelloger account</p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Jane Doe"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="jane@company.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="At least 8 characters"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Confirm password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
