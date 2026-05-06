"use client";
import { useEffect, useState } from "react";
import { Activity, Infinity as InfinityIcon, KeyRound } from "lucide-react";

type Quota = {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number;
  resetInMs: number;
};

type LocalLicense = {
  status: "active" | "grace" | null;
  expires_at: string | null;
  days_left: number | null;
  reported_at: number | null;
  device_id: number;
  device_name: string | null;
  hardware_id: string | null;
};

export function AccountUsageCard({ locale }: { locale: string }) {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [localLicense, setLocalLicense] = useState<LocalLicense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/account/quota", { credentials: "include", cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && data.ok) {
          setQuota(data.quota);
          setLocalLicense(data.local_license || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <div className="h-4 bg-slate-100 rounded w-32 mb-3 animate-pulse" />
        <div className="h-8 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }
  if (!quota) return null;

  // license.dat reported by Desktop overrides the Free counter — paid yearly/lifetime
  // users should see "Unlimited (XXX days left)" instead of "0/3 files".
  const hasLocalLicense = !!(localLicense && (localLicense.status === "active" || localLicense.status === "grace"));

  const isUnlimited = quota.limit === null;
  const pct = isUnlimited ? 100 : Math.round((quota.used / (quota.limit || 1)) * 100);
  const hoursLeft = Math.floor(quota.resetInMs / (60 * 60 * 1000));
  const minutesLeft = Math.floor((quota.resetInMs % (60 * 60 * 1000)) / (60 * 1000));

  function formatExpiry(iso: string | null): string {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      }).format(new Date(iso));
    } catch { return iso; }
  }

  // Local license.dat takes precedence — show as "Unlimited"
  if (hasLocalLicense && localLicense) {
    const days = localLicense.days_left;
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-emerald-700" />
            <h2 className="text-xl font-black text-slate-900">
              {locale === "th" ? "สิทธิ์การใช้งาน" : "License Status"}
            </h2>
          </div>
          {localLicense.status === "grace" && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {locale === "th" ? "ช่วงผ่อนผัน" : "Grace period"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
            <InfinityIcon size={24} className="text-emerald-700" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-lg">
              {locale === "th" ? "ใช้งานไม่จำกัด" : "Unlimited usage"}
            </div>
            <div className="text-xs text-slate-600">
              {typeof days === "number"
                ? (locale === "th"
                    ? <>คงเหลือ <strong>{days.toLocaleString()}</strong> วัน · ใช้ได้ถึง {formatExpiry(localLicense.expires_at)}</>
                    : <>{days.toLocaleString()} days remaining · valid until {formatExpiry(localLicense.expires_at)}</>)
                : (locale === "th" ? "license.dat ใช้งานได้" : "license.dat is active")}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500 bg-white/70 rounded-lg p-2 border border-emerald-100">
          {locale === "th"
            ? <>🖥️ ตรวจพบ <strong>license.dat</strong> ที่ติดตั้งบน <strong>{localLicense.device_name || "Desktop App"}</strong> — Desktop ใช้สิทธิ์นี้แทนแผน Free ของบัญชีเว็บ ดังนั้นไม่ถูกนับโควต้า</>
            : <>🖥️ Detected <strong>license.dat</strong> on <strong>{localLicense.device_name || "Desktop App"}</strong> — Desktop uses this instead of the Free web plan; no quota counted.</>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-blue-600" />
          <h2 className="text-xl font-black text-slate-900">
            {locale === "th" ? "การใช้งานวันนี้" : "Today's Usage"}
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {locale === "th" ? `รีเซ็ตในอีก ${hoursLeft} ชม. ${minutesLeft} นาที` : `Resets in ${hoursLeft}h ${minutesLeft}m`}
        </span>
      </div>

      {/* Note for license.dat users — counters here only reflect web-quota usage */}
      {!isUnlimited && (
        <div className="mb-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
          {locale === "th"
            ? "💡 ตัวเลขนี้นับเฉพาะการใช้งานผ่านบัญชี Free เท่านั้น — ถ้าเครื่องของคุณมี license.dat ที่ใช้งานได้ Desktop App จะใช้สิทธิ์นั้นแบบไม่จำกัด (ไม่ถูกนับที่นี่)"
            : "💡 This counter only tracks web-account Free usage — if your machine has a valid license.dat, the Desktop App uses it for unlimited access (not counted here)."}
        </div>
      )}

      {isUnlimited ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
            <InfinityIcon size={24} className="text-emerald-600" />
          </div>
          <div>
            <div className="font-black text-slate-900">{locale === "th" ? "ไม่จำกัด" : "Unlimited"}</div>
            <div className="text-xs text-slate-500">
              {locale === "th" ? `ใช้ไปแล้ว ${quota.used} ไฟล์วันนี้` : `${quota.used} files used today`}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-3xl font-black text-slate-900">{quota.used}</span>
              <span className="text-slate-500"> / {quota.limit} {locale === "th" ? "ไฟล์" : "files"}</span>
            </div>
            <div className="text-sm font-bold text-slate-700">
              {locale === "th" ? `เหลือ ${quota.remaining}` : `${quota.remaining} left`}
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${pct >= 100 ? "bg-rose-500" : pct >= 67 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          {quota.remaining === 0 && (
            <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {locale === "th"
                ? "📌 คุณใช้ครบโควต้าฟรีของวันนี้แล้ว — อัปเกรดเพื่อใช้ไฟล์ไม่จำกัด"
                : "📌 Daily free quota reached — upgrade for unlimited files."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
