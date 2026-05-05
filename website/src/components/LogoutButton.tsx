"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

export function LogoutButton({ locale }: { locale: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg transition-colors"
    >
      <LogOut size={16} />
      {t("logoutBtn")}
    </button>
  );
}
