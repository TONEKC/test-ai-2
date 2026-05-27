"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type AuthPanelProps = {
  mode: "member" | "admin";
};

type AuthMode = "login" | "register";

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = mode === "admin";
  const title = isAdmin ? "Librarian Login" : "Member Access";
  const description = isAdmin
    ? "Log in with the librarian username and password."
    : "Register a member account or log in with email and password to view loans and borrow from the catalog.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

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
        : isAdmin
          ? {
              identifier: String(form.get("identifier") ?? ""),
              password: String(form.get("password") ?? ""),
              role: "LIBRARIAN",
            }
          : {
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
              role: "MEMBER",
            };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        notify({
          title: "Authentication failed",
          description: data.error ?? "Please check your credentials.",
          variant: "error",
        });
        return;
      }

      notify({
        title: authMode === "register" && !isAdmin ? "Account created" : "Logged in",
        description: isAdmin ? "Librarian dashboard" : "Member dashboard",
        variant: "success",
      });
      router.refresh();
    } catch {
      notify({
        title: "Network error",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl grid-cols-12 gap-5 px-4 py-10 sm:px-6 lg:gap-6 lg:py-16">
      <div className="col-span-12 space-y-5 lg:col-span-7">
        <p className="text-sm font-semibold uppercase text-amber-700">
          Library Lending System
        </p>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Catalog</div>
            <div className="mt-1 text-slate-600">Browse available books</div>
          </div>
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Borrowing</div>
            <div className="mt-1 text-slate-600">Track active loans</div>
          </div>
          <div className="border border-amber-200 bg-white/90 p-4">
            <div className="font-semibold text-slate-950">Returns</div>
            <div className="mt-1 text-slate-600">Review fines and history</div>
          </div>
        </div>
      </div>

      <div className="col-span-12 border border-amber-200 bg-white/95 p-5 shadow-sm lg:col-span-5">
        {!isAdmin ? (
          <div className="mb-5 grid grid-cols-2 border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
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

          {!isAdmin && authMode === "register" ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Email</span>
              <input
                name="email"
                type="email"
                required
                className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
                placeholder="you@email.com"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                {isAdmin ? "Username" : "Email"}
              </span>
              <input
                name={isAdmin ? "identifier" : "email"}
                type={isAdmin ? "text" : "email"}
                required
                className="mt-1 h-11 w-full border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-emerald-700"
                placeholder={isAdmin ? "admin" : "you@email.com"}
              />
            </label>
          )}

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

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading
              ? "Please wait..."
              : isAdmin
                ? "Login as Librarian"
                : authMode === "register"
                  ? "Create Account"
                  : "Enter Library"}
          </button>
        </form>
      </div>
    </section>
  );
}
