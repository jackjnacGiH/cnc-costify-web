"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Cpu, KeyRound, Loader2, AlertCircle, CheckCircle2,
  Search, Download, Copy, Mail, Gem, Crown,
} from "lucide-react";

type UserMatch = {
  id: number;
  email: string;
  name: string | null;
  plan: string;
  plan_expires_at: number | null;
};

type Plan = "yearly" | "lifetime";

type GenerateResponse =
  | { ok: true; license: { id: number; license_key: string; plan: string; valid_until: number | null; hardware_id: string };
      license_dat_json: unknown;
      daysAdded: number; remainingDays: number; totalDays: number;
      validUntilMs: number | null; isLifetime: boolean }
  | { ok: false; error: string };

const PLAN_DAYS = { yearly: 455, lifetime: 36500 } as const;

function fmtDate(ms: number | null, locale: string): string {
  if (!ms) return locale === "th" ? "ตลอดชีพ ♾️" : "Lifetime ♾️";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(ms));
}

export function LicenseGeneratorForm({
  locale, presetUserId, presetUserEmail,
}: {
  locale: string;
  presetUserId: number | null;
  presetUserEmail: string | null;
}) {
  const [searchQ, setSearchQ] = useState(presetUserEmail || "");
  const [searchResults, setSearchResults] = useState<UserMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserMatch | null>(null);

  const [hardwareId, setHardwareId] = useState("");
  const [plan, setPlan] = useState<Plan>("yearly");
  const [notes, setNotes] = useState("");
  const [force, setForce] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  // Resolve preset user (search by id or email if URL had ?user_id= / ?user_email=)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (presetUserId) {
        try {
          const r = await fetch(`/api/admin/users/${presetUserId}`, { credentials: "include", cache: "no-store" });
          const data = await r.json().catch(() => ({}));
          if (!cancelled && r.ok && data.ok) {
            setSelectedUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              plan: data.user.plan,
              plan_expires_at: data.user.plan_expires_at,
            });
            setSearchQ(data.user.email);
          }
        } catch { /* ignore */ }
      } else if (presetUserEmail) {
        // Trigger initial search
        runSearch(presetUserEmail);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetUserId, presetUserEmail]);

  // Debounced user search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=10`, {
        credentials: "include", cache: "no-store",
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) setSearchResults(data.users || []);
      else setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser && searchQ === selectedUser.email) return; // don't re-search after selection
    const t = setTimeout(() => runSearch(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ, runSearch, selectedUser]);

  // Calculate preview based on selected user
  const remainingDays = (() => {
    if (!selectedUser?.plan_expires_at) return 0;
    return Math.max(0, Math.ceil((selectedUser.plan_expires_at - Date.now()) / 86400000));
  })();
  const isLifetimeUser = selectedUser?.plan === "lifetime" && !selectedUser.plan_expires_at;
  const lifetimeBlocked = isLifetimeUser && plan !== "lifetime" && !force;
  const planDays = PLAN_DAYS[plan];
  const newTotalDays = plan === "lifetime"
    ? null
    : (isLifetimeUser && force ? planDays : remainingDays + planDays);
  const newExpiry = plan === "lifetime" ? null : (newTotalDays !== null ? Date.now() + newTotalDays * 86400000 : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!selectedUser) {
      setError(locale === "th" ? "กรุณาเลือก user" : "Please select a user");
      return;
    }
    if (hardwareId.trim().length < 8) {
      setError(locale === "th" ? "Hardware ID สั้นเกินไป" : "Hardware ID too short");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/license/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          hardware_id: hardwareId.trim(),
          plan,
          notes: notes.trim() || undefined,
          force,
        }),
      });
      const data: GenerateResponse = await r.json().catch(() => ({ ok: false, error: "parse_failed" } as GenerateResponse));
      if (r.ok && data.ok) {
        setResult(data);
      } else {
        const code = (data as { error?: string }).error || "unknown";
        const messages: Record<string, { th: string; en: string }> = {
          user_not_found: { th: "ไม่พบผู้ใช้ — กรุณาให้สมัครเว็บก่อน", en: "User not found — ask them to sign up first" },
          user_already_lifetime: { th: "ผู้ใช้มี Lifetime แล้ว — ติ๊ก Force ถ้าต้องการ override", en: "User already has Lifetime — tick Force to override" },
          monthly_not_supported_for_license_dat: { th: "Monthly ใช้ออนไลน์เท่านั้น ไม่ออก license.dat", en: "Monthly is online-only, no .dat issued" },
          missing_hardware_id: { th: "ขาด Hardware ID", en: "Missing Hardware ID" },
        };
        setError(messages[code]?.[locale as "th" | "en"] || `${code}`);
      }
    } catch {
      setError(locale === "th" ? "เครือข่ายขัดข้อง" : "Network error");
    } finally {
      setBusy(false);
    }
  };

  // Success state
  if (result && result.ok) {
    const lic = result.license;
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle2 size={32} className="text-emerald-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {locale === "th" ? "สร้าง License เรียบร้อย!" : "License generated!"}
            </h2>
            <p className="text-sm text-slate-600">
              {locale === "th"
                ? `ส่งอีเมลแจ้ง ${selectedUser?.email} อัตโนมัติแล้ว`
                : `Email sent to ${selectedUser?.email} automatically`}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-emerald-200 mb-4">
          <div className="text-xs text-slate-500 mb-1">License Key</div>
          <div className="font-mono font-black text-lg text-slate-900 select-all break-all">{lic.license_key}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">{locale === "th" ? "แพ็กเกจ" : "Plan"}</div>
            <div className="font-bold uppercase text-slate-900">{lic.plan}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500">{locale === "th" ? "ใช้ได้ถึง" : "Valid until"}</div>
            <div className="font-bold text-slate-900">{fmtDate(lic.valid_until, locale)}</div>
          </div>
          {!result.isLifetime && (
            <div className="bg-white rounded-lg p-3 border border-slate-200 sm:col-span-2">
              <div className="text-xs text-slate-500">{locale === "th" ? "การคำนวณ" : "Calculation"}</div>
              <div className="text-sm text-slate-700">
                {locale === "th"
                  ? <>คงเหลือเดิม <strong>{result.remainingDays}</strong> วัน + แพ็กเกจ <strong>{result.daysAdded}</strong> วัน = <strong>{result.totalDays}</strong> วัน</>
                  : <><strong>{result.remainingDays}</strong> days remaining + <strong>{result.daysAdded}</strong> plan days = <strong>{result.totalDays}</strong> days total</>}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <a
            href={`/api/admin/licenses/${lic.id}/dat`}
            download={`license-${lic.license_key}.dat`}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg"
          >
            <Download size={16} />
            {locale === "th" ? "ดาวน์โหลด .dat" : "Download .dat"}
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.license_dat_json, null, 2))}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg"
          >
            <Copy size={16} />
            {locale === "th" ? "คัดลอก JSON" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={() => { setResult(null); setHardwareId(""); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
          >
            {locale === "th" ? "ออก License ใหม่อีก" : "Issue another license"}
          </button>
        </div>
        <details className="bg-white rounded-lg p-3 border border-slate-200 text-xs">
          <summary className="cursor-pointer font-bold text-slate-700">
            {locale === "th" ? "ดู Signed JSON ทั้งหมด" : "View full signed JSON"}
          </summary>
          <pre className="mt-2 p-3 bg-slate-900 text-emerald-300 rounded overflow-auto max-h-64">
            {JSON.stringify(result.license_dat_json, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      {/* User search */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Search size={14} className="text-slate-500" />
          {locale === "th" ? "ค้นหา User (อีเมล / ชื่อ)" : "Search user (email / name)"}
          <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => { setSearchQ(e.target.value); setSelectedUser(null); }}
            placeholder={locale === "th" ? "พิมพ์เพื่อค้นหา..." : "Type to search..."}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
        {searchQ && !selectedUser && searchResults.length > 0 && (
          <ul className="mt-1 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white shadow-sm max-h-64 overflow-y-auto">
            {searchResults.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(u); setSearchQ(u.email); setSearchResults([]); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                >
                  <div className="font-bold text-slate-900">{u.name || u.email}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{u.email}</span>
                    <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                      u.plan === "free" ? "bg-slate-100 text-slate-700" :
                      u.plan === "monthly" ? "bg-blue-100 text-blue-700" :
                      u.plan === "yearly" ? "bg-purple-100 text-purple-700" :
                      "bg-amber-100 text-amber-800"
                    }`}>{u.plan}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchQ.length >= 2 && !searching && searchResults.length === 0 && !selectedUser && (
          <div className="mt-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
            {locale === "th" ? "ไม่พบผู้ใช้ — ขอให้สมัครเว็บก่อน" : "No user found — ask them to sign up first"}
          </div>
        )}
        {selectedUser && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <div className="font-bold text-slate-900">{selectedUser.name || selectedUser.email}</div>
                <div className="text-xs text-slate-600">{selectedUser.email}</div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-0.5 rounded uppercase font-bold text-xs ${
                  selectedUser.plan === "free" ? "bg-slate-100 text-slate-700" :
                  selectedUser.plan === "monthly" ? "bg-blue-100 text-blue-700" :
                  selectedUser.plan === "yearly" ? "bg-purple-100 text-purple-700" :
                  "bg-amber-100 text-amber-800"
                }`}>{selectedUser.plan}</span>
                {!isLifetimeUser && selectedUser.plan_expires_at && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    {locale === "th" ? `เหลือ ${remainingDays} วัน` : `${remainingDays} days left`}
                  </div>
                )}
                {isLifetimeUser && (
                  <div className="text-xs text-amber-700 mt-0.5 font-bold">{locale === "th" ? "ตลอดชีพ ♾️" : "Lifetime ♾️"}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hardware ID */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Cpu size={14} className="text-blue-600" />
          Hardware ID <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={hardwareId}
          onChange={(e) => setHardwareId(e.target.value)}
          placeholder="sha256:abc123def456..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-slate-500 mt-1.5">
          {locale === "th"
            ? "💡 ผู้ใช้คัดลอกจาก Desktop App → แท็บ \"สิทธิ์การใช้งาน\" → ปุ่ม \"คัดลอก\" ข้าง Hardware ID"
            : "💡 User copies from Desktop App → License tab → Copy button next to Hardware ID"}
        </p>
      </div>

      {/* Plan */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {locale === "th" ? "แพ็กเกจ" : "Plan"} <span className="text-rose-500">*</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            plan === "yearly" ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-purple-300"
          }`}>
            <input type="radio" name="plan" value="yearly" checked={plan === "yearly"} onChange={() => setPlan("yearly")} className="mt-1" />
            <div className="flex-1">
              <div className="font-black flex items-center gap-1.5">
                <Gem size={14} className="text-purple-600" />
                Yearly <span className="text-xs font-bold text-purple-700">+455 {locale === "th" ? "วัน" : "days"}</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {locale === "th" ? "12 + ฟรี 3 เดือน — ใช้ออฟไลน์ได้" : "12 + 3 free months — offline OK"}
              </div>
            </div>
          </label>
          <label className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
            plan === "lifetime" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-amber-300"
          }`}>
            <input type="radio" name="plan" value="lifetime" checked={plan === "lifetime"} onChange={() => setPlan("lifetime")} className="mt-1" />
            <div className="flex-1">
              <div className="font-black flex items-center gap-1.5">
                <Crown size={14} className="text-amber-600" />
                Lifetime <span className="text-xs font-bold text-amber-700">∞</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {locale === "th" ? "ตลอดชีพ — ใช้ออฟไลน์ได้" : "Forever — offline OK"}
              </div>
            </div>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {locale === "th" ? "Monthly online-only ไม่ออก license.dat" : "Monthly is online-only — no .dat issued"}
        </p>
      </div>

      {/* Preview */}
      {selectedUser && (
        <div className="mb-5 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="text-xs font-bold text-slate-700 mb-2 uppercase">
            🔮 {locale === "th" ? "พรีวิว" : "Preview"}
          </div>
          {lifetimeBlocked ? (
            <div className="text-sm text-rose-700">
              ⚠️ {locale === "th"
                ? "ผู้ใช้มี Lifetime อยู่แล้ว — ติ๊ก Force ด้านล่างถ้าต้องการ override"
                : "User already has Lifetime — tick Force below to override"}
            </div>
          ) : plan === "lifetime" ? (
            <div className="text-sm text-slate-800">
              {locale === "th"
                ? <><strong>{selectedUser.name || selectedUser.email}</strong> จะได้สิทธิ์ <strong className="text-amber-700">ตลอดชีพ ♾️</strong></>
                : <><strong>{selectedUser.name || selectedUser.email}</strong> gets <strong className="text-amber-700">Lifetime ♾️</strong></>}
            </div>
          ) : (
            <div className="text-sm text-slate-800 space-y-1">
              <div>
                {locale === "th"
                  ? <>คงเหลือเดิม: <strong>{remainingDays}</strong> วัน</>
                  : <>Remaining: <strong>{remainingDays}</strong> days</>}
              </div>
              <div>
                {locale === "th"
                  ? <>+ แพ็กเกจ {plan}: <strong>{planDays}</strong> วัน</>
                  : <>+ {plan} plan: <strong>{planDays}</strong> days</>}
              </div>
              <div className="border-t border-blue-300 pt-1 mt-1">
                {locale === "th"
                  ? <>= รวม <strong className="text-purple-700">{newTotalDays}</strong> วัน → ใช้ได้ถึง <strong>{fmtDate(newExpiry, locale)}</strong></>
                  : <>= Total <strong className="text-purple-700">{newTotalDays}</strong> days → valid until <strong>{fmtDate(newExpiry, locale)}</strong></>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mb-5">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {locale === "th" ? "หมายเหตุ (ภายใน admin)" : "Notes (admin internal)"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={locale === "th" ? "เช่น ลูกค้า VIP, ทดแทน license หาย..." : "e.g. VIP customer, replace lost license..."}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Force checkbox (only relevant if user has lifetime) */}
      {isLifetimeUser && plan === "yearly" && (
        <div className="mb-5">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <div className="font-bold text-rose-700">
                {locale === "th" ? "Force override (Lifetime → Yearly)" : "Force override (Lifetime → Yearly)"}
              </div>
              <div className="text-xs text-slate-600">
                {locale === "th"
                  ? "ผู้ใช้มี Lifetime แล้ว — ติ๊กเพื่อ downgrade เป็น Yearly (พลิกกลับลำบาก ใช้กรณี admin ผิดพลาดเท่านั้น)"
                  : "User has Lifetime — tick to downgrade to Yearly (hard to undo, only for admin mistakes)"}
              </div>
            </div>
          </label>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !selectedUser || !hardwareId.trim() || lifetimeBlocked}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {busy ? (
          <><Loader2 size={18} className="animate-spin" /> {locale === "th" ? "กำลังออก License..." : "Generating..."}</>
        ) : (
          <><KeyRound size={18} /> {locale === "th" ? "ออก License + ส่งอีเมล" : "Generate License + Email"}</>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center mt-3">
        <Mail size={12} className="inline mr-1" />
        {locale === "th"
          ? "ระบบจะส่งอีเมลพร้อม license.dat ให้ลูกค้าโดยอัตโนมัติ"
          : "System will email license.dat to customer automatically"}
      </p>
    </form>
  );
}
