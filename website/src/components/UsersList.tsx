"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Search, Loader2, Users, AlertCircle, RefreshCcw } from "lucide-react";

type User = {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  plan: string;
  plan_expires_at: number | null;
  verified: number;
  created_at: number;
  last_login_at: number | null;
};

const PLAN_BADGE: Record<string, string> = {
  free:     "bg-slate-100 text-slate-700",
  monthly:  "bg-blue-100 text-blue-700",
  yearly:   "bg-purple-100 text-purple-700",
  lifetime: "bg-amber-100 text-amber-800",
};

function fmtDate(ms: number | null, locale: string): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(ms));
}

function fmtRel(ms: number | null, locale: string): string {
  if (!ms) return "—";
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return locale === "th" ? "เพิ่งใช้งาน" : "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return locale === "th" ? `${m} นาทีที่แล้ว` : `${m}m ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return locale === "th" ? `${h} ชม.ที่แล้ว` : `${h}h ago`;
  }
  const d = Math.floor(diffSec / 86400);
  return locale === "th" ? `${d} วันที่แล้ว` : `${d}d ago`;
}

export function UsersList({ locale: localeProp }: { locale?: string }) {
  const locale = localeProp || useLocale();
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (planFilter) url.searchParams.set("plan", planFilter);
      url.searchParams.set("limit", "100");
      const r = await fetch(url.toString(), { credentials: "include", cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else {
        setError(data?.error || "load_failed");
        setUsers([]);
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  }, [q, planFilter]);

  // Initial load
  useEffect(() => {
    const t = setTimeout(() => load(), 250); // debounce on query/filter change
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={locale === "th" ? "ค้นหา email หรือชื่อ..." : "Search by email or name..."}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{locale === "th" ? "ทุกแพ็กเกจ" : "All plans"}</option>
          <option value="free">FREE</option>
          <option value="monthly">MONTHLY</option>
          <option value="yearly">YEARLY</option>
          <option value="lifetime">LIFETIME</option>
        </select>
        <button
          onClick={load}
          className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1"
        >
          <RefreshCcw size={12} />
          {locale === "th" ? "รีเฟรช" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 mb-4">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          {locale === "th" ? "กำลังโหลด..." : "Loading..."}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">{locale === "th" ? "ไม่พบผู้ใช้" : "No users found"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            {locale === "th" ? `แสดง ${users.length} จาก ${total} ผู้ใช้` : `Showing ${users.length} of ${total} users`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "อีเมล" : "Email"}</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "ชื่อ" : "Name"}</th>
                  <th className="px-3 py-2 text-center font-bold text-slate-700">{locale === "th" ? "แพ็กเกจ" : "Plan"}</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "หมดอายุ" : "Expires"}</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "เข้าใช้งานล่าสุด" : "Last login"}</th>
                  <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "สมัครเมื่อ" : "Signed up"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link href={`/${locale}/admin/users/${u.id}`} className="text-blue-700 hover:underline font-medium">
                        {u.email}
                      </Link>
                      {!u.verified && (
                        <span className="ml-1 text-[10px] text-amber-700 bg-amber-50 px-1 rounded">unverified</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <div className="font-medium">{u.name || "—"}</div>
                      {u.company && <div className="text-xs text-slate-500">{u.company}</div>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded uppercase font-bold text-xs ${PLAN_BADGE[u.plan] || PLAN_BADGE.free}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {u.plan === "lifetime" ? "♾️" : u.plan_expires_at ? fmtDate(u.plan_expires_at, locale) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{fmtRel(u.last_login_at, locale)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(u.created_at, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
