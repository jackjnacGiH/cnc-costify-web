"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowUp, KeyRound } from "lucide-react";

type Plan = "free" | "monthly" | "yearly" | "lifetime" | string;

type LocalLicense = {
  status: "active" | "grace" | null;
  expires_at: string | null;
  days_left: number | null;
};

const PLAN_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  free:     { bg: "bg-slate-100",  text: "text-slate-700",  icon: "🆓" },
  monthly:  { bg: "bg-blue-100",   text: "text-blue-700",   icon: "⭐" },
  yearly:   { bg: "bg-purple-100", text: "text-purple-700", icon: "💎" },
  lifetime: { bg: "bg-amber-100",  text: "text-amber-700",  icon: "👑" },
};

function formatDate(iso: string | number | null, locale: string): string {
  if (!iso) return "—";
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  }).format(d);
}

export function AccountPlanCard({
  locale,
  plan,
  planExpiresAt,
}: {
  locale: string;
  plan: Plan;
  planExpiresAt: number | null;
}) {
  const [localLicense, setLocalLicense] = useState<LocalLicense | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/account/quota", { credentials: "include", cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && data.ok) setLocalLicense(data.local_license || null);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasLocalLicense = !!(localLicense && (localLicense.status === "active" || localLicense.status === "grace"));

  // ── License.dat present → show "License (Yearly/Lifetime) until <date>" ──
  if (hasLocalLicense && localLicense) {
    const days = localLicense.days_left ?? 0;
    // Heuristic: > 350 days → yearly-like, > 5 yr → lifetime-like
    const looksLifetime = days > 5 * 365;
    const styleKey = looksLifetime ? "lifetime" : "yearly";
    const style = PLAN_STYLES[styleKey];
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {locale === "th" ? "แพ็กเกจปัจจุบัน" : "Current Plan"}
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ${style.bg} ${style.text}`}>
              <span>{style.icon}</span>
              <span className="uppercase">
                {looksLifetime ? "LIFETIME" : "YEARLY"}
              </span>
              <span className="text-xs font-bold ml-1 opacity-80">
                ({locale === "th" ? "License.dat" : "License.dat"})
              </span>
            </div>
            <div className="mt-3 text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <Calendar size={14} />
              {locale === "th" ? "ใช้ได้ถึง:" : "Valid until:"}{" "}
              <strong>
                {looksLifetime
                  ? (locale === "th" ? "ตลอดชีพ ♾️" : "Lifetime ♾️")
                  : formatDate(localLicense.expires_at, locale)}
              </strong>
              {!looksLifetime && (
                <span className="text-xs text-emerald-700 font-bold">
                  ({locale === "th" ? `เหลือ ${days} วัน` : `${days} days left`})
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <KeyRound size={12} />
              {locale === "th"
                ? "อ้างอิงจาก license.dat ที่ติดตั้งบนเครื่องของคุณ"
                : "Detected from license.dat installed on your machine"}
            </div>
          </div>
          {!looksLifetime && (
            <Link
              href={`/${locale}/upgrade`}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <ArrowUp size={16} />
              {locale === "th" ? "อัปเกรด" : "Upgrade"}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── No license.dat → fall back to web account plan ──
  const style = PLAN_STYLES[plan] || PLAN_STYLES.free;
  const isLifetime = plan === "lifetime";
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {locale === "th" ? "แพ็กเกจปัจจุบัน" : "Current Plan"}
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ${style.bg} ${style.text}`}>
            <span>{style.icon}</span>
            <span className="uppercase">{plan}</span>
          </div>
          <div className="mt-3 text-sm text-slate-600 flex items-center gap-2">
            <Calendar size={14} />
            {locale === "th" ? "ใช้ได้ถึง:" : "Valid until:"}{" "}
            <strong>
              {isLifetime
                ? (locale === "th" ? "ตลอดชีพ ♾️" : "Lifetime ♾️")
                : (planExpiresAt
                    ? formatDate(planExpiresAt, locale)
                    : (locale === "th" ? "ใช้งานฟรีตลอด" : "Free forever"))}
            </strong>
          </div>
        </div>
        {plan !== "lifetime" && (
          <Link
            href={`/${locale}/upgrade`}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
          >
            <ArrowUp size={16} />
            {locale === "th" ? "อัปเกรด" : "Upgrade"}
          </Link>
        )}
      </div>
    </div>
  );
}
