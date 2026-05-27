"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function LogoutButton() {
  const router = useRouter();
  const { notify } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        notify({
          title: "Unable to log out",
          description: "Please try again.",
          variant: "error",
        });
        return;
      }

      notify({
        title: "Logged out",
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
    <button
      type="button"
      onClick={logout}
      disabled={isLoading}
      className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
