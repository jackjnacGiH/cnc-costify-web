"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Download, Sparkles } from "lucide-react";

const HIDDEN_ROUTES = ["/login", "/signup", "/account", "/admin", "/desktop-auth"];

export function MobileActionBar() {
  const locale = useLocale();
  const pathname = usePathname();
  const localizedPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  if (HIDDEN_ROUTES.some((route) => localizedPath.startsWith(route))) return null;

  return (
    <aside
      aria-label={locale === "th" ? "ทางลัดเริ่มใช้งาน" : "Quick actions"}
      className="mobile-action-bar fixed inset-x-3 bottom-3 z-50 grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-slate-950/90 p-2 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:hidden"
    >
      <Link
        href={`/${locale}/download`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20"
      >
        <Download size={17} aria-hidden="true" />
        {locale === "th" ? "ดาวน์โหลด" : "Download"}
      </Link>
      <Link
        href={`/${locale}/signup`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
      >
        <Sparkles size={17} aria-hidden="true" />
        {locale === "th" ? "เริ่มใช้ฟรี" : "Start free"}
      </Link>
    </aside>
  );
}
