"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthPanelProps = {
  mode: "member" | "admin";
};

type AuthMode = "login" | "register";

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isAdmin = mode === "admin";
  const title = isAdmin ? "Librarian Login" : "Member Access";
  const description = isAdmin
    ? "Enter the restricted stacks with the librarian credentials configured in Vercel."
    : "Register a member account or log in to view your loans and borrow from the catalog.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const endpoint =
      !isAdmin && authMode === "register"
        ? "/api/auth/register"
        : "/api/auth/login";

    const payload =
      !isAdmin && authMode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            phone: String(form.get("phone") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            role: isAdmin ? "LIBRARIAN" : "MEMBER",
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Authentication failed.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[1fr_420px] lg:items-start lg:py-16">
      <div className="space-y-5">
        <p className="text-sm font-semibold uppercase text-amber-700">
          Arcane Grand Library
        </p>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>
        </div>
        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Secure Session</div>
            <div className="mt-1 text-slate-600">HTTP-only JWT cookie</div>
          </div>
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Prisma Ready</div>
            <div className="mt-1 text-slate-600">Supabase PostgreSQL</div>
          </div>
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Vercel CI/CD</div>
            <div className="mt-1 text-slate-600">Deploy by Git push</div>
          </div>
        </div>
      </div>

      <div className="border border-amber-200 bg-white/95 p-5 shadow-sm">
        {!isAdmin ? (
          <div className="mb-5 grid grid-cols-2 border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setMessage("");
              }}
              className={`px-4 py-2 text-sm font-semibold transition ${
                authMode === "login"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setMessage("");
              }}
              className={`px-4 py-2 text-sm font-semibold transition ${
                authMode === "register"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Register
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && authMode === "register" ? (
            <>
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Name</span>
                <input
                  name="name"
                  required
                  minLength={2}
                  className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
                  placeholder="Your full name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  Phone
                </span>
                <input
                  name="phone"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{9,15}"
                  title="Phone must contain 9 to 15 digits."
                  onInput={(event) => {
                    event.currentTarget.value =
                      event.currentTarget.value.replace(/\D/g, "");
                  }}
                  className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
                  placeholder="Digits only"
                />
              </label>
            </>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
              placeholder={isAdmin ? "admin@library.local" : "you@email.com"}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={isAdmin ? 1 : 8}
              className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
              placeholder="Password"
            />
          </label>

          {message ? (
            <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading
              ? "Please wait..."
              : isAdmin
            ? "Enter Restricted Stacks"
                : authMode === "register"
                  ? "Create Member Seal"
                  : "Enter Library"}
          </button>
        </form>
      </div>
    </section>
  );
}
