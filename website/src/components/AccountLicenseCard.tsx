"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Download, Loader2, ShieldCheck } from "lucide-react";

type License = {
  id: number;
  license_key: string;
  plan: string;
  valid_from: number;
  valid_until: number;
  hardware_id: string | null;
  revoked: number;
};

/**
 * Shows the user's most recent active license (if any) with a button to
 * download the license.dat file. Only renders for users with paid offline
 * plans (yearly/lifetime). Returns null silently for free/monthly users.
 */
export function AccountLicenseCard({ locale }: { locale: string }) {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // We piggyback on the existing /devices endpoint? No — make a small one.
        // For now we only know if user has license by trying to download it.
        // Better: GET /api/account/license-info (returns license metadata).
        // For now, just try the download endpoint with HEAD to detect.
        const r = await fetch("/api/account/license-info", { credentials: "include", cache: "no-store" });
        if (!cancelled && r.ok) {
          const data = await r.json().catch(() => ({}));
          if (data.ok && data.license) setLicense(data.license);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <div className="h-4 bg-slate-100 rounded w-48 mb-3 animate-pulse" />
        <div className="h-12 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }
  if (!license) return null;

  const isLifetime = license.plan === "lifetime";
  const validUntil = isLifetime ? null : new Intl.DateTimeFormat(
    locale === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  ).format(new Date(license.valid_until));
  const daysLeft = isLifetime ? null : Math.max(0, Math.ceil((license.valid_until - Date.now()) / 86400000));

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <KeyRound size={20} className="text-emerald-700" />
          <h2 className="text-xl font-black text-slate-900">
            {locale === "th" ? "License Key สำหรับ Desktop" : "Desktop License Key"}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-200 text-emerald-900">
          <ShieldCheck size={12} />
          {locale === "th" ? "ใช้งานได้" : "Active"}
        </span>
      </div>

      <div className="bg-white/70 rounded-lg p-3 border border-emerald-100 mb-3">
        <div className="text-xs text-slate-500 mb-0.5">License Key</div>
        <div className="font-mono font-black text-base text-slate-900 select-all">
          {license.license_key}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mb-4 text-xs text-slate-700">
        <div>
          <div className="text-slate-500">{locale === "th" ? "แพ็กเกจ" : "Plan"}</div>
          <div className="font-bold uppercase text-slate-900">{license.plan}</div>
        </div>
        <div>
          <div className="text-slate-500">{locale === "th" ? "ใช้ได้ถึง" : "Valid until"}</div>
          <div className="font-bold text-slate-900">
            {isLifetime
              ? (locale === "th" ? "ตลอดชีพ ♾️" : "Lifetime ♾️")
              : <>{validUntil} {daysLeft !== null && <span className="text-emerald-700">({daysLeft} {locale === "th" ? "วัน" : "days"})</span>}</>}
          </div>
        </div>
      </div>

      <a
        href="/api/account/license-dat"
        download={`license-${license.license_key}.dat`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        <Download size={18} />
        {locale === "th" ? "ดาวน์โหลด License (.dat)" : "Download License (.dat)"}
      </a>

      <p className="mt-3 text-xs text-slate-600">
        {locale === "th"
          ? <>📥 เปิด CNC Costify AI Desktop → แท็บ <strong>"สิทธิ์การใช้งาน"</strong> → กด <strong>"นำเข้าสิทธิ์การใช้งาน"</strong> → เลือกไฟล์ .dat ที่ดาวน์โหลด</>
          : <>📥 Open CNC Costify AI Desktop → <strong>License</strong> tab → click <strong>Import License</strong> → pick the .dat file</>}
      </p>
    </div>
  );
}

/**
 * Small "View Order History" link block shown in the account page footer.
 */
export function AccountOrdersLink({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/account/orders`}
      className="block bg-white rounded-2xl shadow-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-xl transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-black text-slate-900 text-sm">
            📋 {locale === "th" ? "ประวัติคำสั่งซื้อ" : "Order History"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {locale === "th" ? "ดู order ที่ผ่านมา + สถานะการชำระเงิน" : "View past orders + payment status"}
          </div>
        </div>
        <span className="text-blue-600 text-sm">→</span>
      </div>
    </Link>
  );
}
