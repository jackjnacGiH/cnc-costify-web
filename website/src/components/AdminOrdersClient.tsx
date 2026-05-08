"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, FileImage, Clock, AlertCircle, RefreshCcw } from "lucide-react";

type Order = {
  id: number;
  user_id: number;
  user_email: string | null;
  user_name: string | null;
  plan: string;
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  slip_path: string | null;
  payment_ref: string | null;
  created_at: number;
  confirmed_at: number | null;
  notes: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: { th: string; en: string } }> = {
  pending:   { bg: "bg-amber-100",   text: "text-amber-800",   label: { th: "รอตรวจสอบ", en: "Pending" } },
  confirmed: { bg: "bg-emerald-100", text: "text-emerald-700", label: { th: "ยืนยันแล้ว",  en: "Confirmed" } },
  rejected:  { bg: "bg-rose-100",    text: "text-rose-700",    label: { th: "ปฏิเสธ",     en: "Rejected" } },
  cancelled: { bg: "bg-slate-100",   text: "text-slate-600",   label: { th: "ยกเลิก",     en: "Cancelled" } },
};

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
};

function fmtDate(ms: number, locale: string): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ms));
}

export function AdminOrdersClient({ locale }: { locale: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipModal, setSlipModal] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${filter}`;
      const r = await fetch(url, { credentials: "include", cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        setError(data?.error || "load_failed");
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const confirmOrder = async (id: number) => {
    if (!confirm(locale === "th" ? `ยืนยัน Order #${id}? ระบบจะส่ง license + email อัตโนมัติ` : `Confirm order #${id}? System will issue license + send email.`)) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/orders/${id}/confirm`, { method: "POST", credentials: "include" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        alert(`Error: ${data?.error || "confirm_failed"}`);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const rejectOrder = async (id: number) => {
    const reason = prompt(locale === "th" ? "เหตุผลการปฏิเสธ:" : "Rejection reason:");
    if (reason === null) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/orders/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        alert(`Error: ${data?.error || "reject_failed"}`);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending", "confirmed", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {f === "all"
              ? (locale === "th" ? "ทั้งหมด" : "All")
              : (STATUS_STYLES[f]?.label[locale as "th" | "en"] || f)}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto px-3 py-1.5 text-xs font-bold rounded-md border border-slate-300 hover:bg-slate-100 flex items-center gap-1"
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
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            {locale === "th" ? "ไม่มี Order ในเงื่อนไขนี้" : "No orders match this filter"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-700">#</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "ลูกค้า" : "Customer"}</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "แพ็กเกจ" : "Plan"}</th>
                <th className="px-3 py-2 text-right font-bold text-slate-700">{locale === "th" ? "ยอด" : "Amount"}</th>
                <th className="px-3 py-2 text-center font-bold text-slate-700">{locale === "th" ? "สลิป" : "Slip"}</th>
                <th className="px-3 py-2 text-center font-bold text-slate-700">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">{locale === "th" ? "วันที่" : "Date"}</th>
                <th className="px-3 py-2 text-center font-bold text-slate-700">{locale === "th" ? "การจัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const s = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                const slipFile = o.slip_path ? o.slip_path.split("/").pop() : null;
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-500">{o.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-900 truncate max-w-[180px]">{o.user_name || "—"}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">{o.user_email}</div>
                    </td>
                    <td className="px-3 py-2 font-bold uppercase">{PLAN_LABELS[o.plan] || o.plan}</td>
                    <td className="px-3 py-2 text-right font-bold">฿{Number(o.amount).toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      {slipFile ? (
                        <button
                          onClick={() => setSlipModal(`/api/admin/slip/${slipFile}`)}
                          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                        >
                          <FileImage size={14} />
                          {locale === "th" ? "ดู" : "View"}
                        </button>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${s.bg} ${s.text}`}>
                        {s.label[locale as "th" | "en"]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(o.created_at, locale)}</td>
                    <td className="px-3 py-2 text-center">
                      {o.status === "pending" ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => confirmOrder(o.id)}
                            disabled={busyId === o.id}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50"
                            title={locale === "th" ? "ยืนยัน" : "Confirm"}
                          >
                            {busyId === o.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          </button>
                          <button
                            onClick={() => rejectOrder(o.id)}
                            disabled={busyId === o.id}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded disabled:opacity-50"
                            title={locale === "th" ? "ปฏิเสธ" : "Reject"}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {o.confirmed_at ? fmtDate(o.confirmed_at, locale) : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip viewer modal */}
      {slipModal && (
        <div
          onClick={() => setSlipModal(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-2xl max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">{locale === "th" ? "สลิปการโอน" : "Payment slip"}</h3>
              <button onClick={() => setSlipModal(null)} className="text-slate-500 hover:text-slate-900">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slipModal} alt="Payment slip" className="max-w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
