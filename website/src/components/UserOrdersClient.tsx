"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Clock, AlertCircle, ShoppingCart } from "lucide-react";

type Order = {
  id: number;
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: { th: string; en: string }; icon: string }> = {
  pending:   { bg: "bg-amber-100",   text: "text-amber-800",   label: { th: "รอตรวจสอบ", en: "Pending" }, icon: "⏳" },
  confirmed: { bg: "bg-emerald-100", text: "text-emerald-700", label: { th: "ยืนยันแล้ว",  en: "Confirmed" }, icon: "✅" },
  rejected:  { bg: "bg-rose-100",    text: "text-rose-700",    label: { th: "ปฏิเสธ",     en: "Rejected" }, icon: "❌" },
  cancelled: { bg: "bg-slate-100",   text: "text-slate-600",   label: { th: "ยกเลิก",     en: "Cancelled" }, icon: "—" },
};

function fmtDate(ms: number, locale: string): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ms));
}

export function UserOrdersClient({ locale }: { locale: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/order/my", { credentials: "include", cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !data.ok) {
          setError(data?.error || "load_failed");
        } else {
          setOrders(data.orders || []);
        }
      } catch {
        if (!cancelled) setError("network");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 size={20} className="animate-spin mr-2" />
        {locale === "th" ? "กำลังโหลด..." : "Loading..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <span>{locale === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Failed to load orders"}</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <ShoppingCart size={48} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 mb-4">
          {locale === "th" ? "ยังไม่มี Order" : "No orders yet"}
        </p>
        <Link
          href={`/${locale}/upgrade`}
          className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          {locale === "th" ? "ดูแพ็กเกจ" : "View Plans"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const s = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
        return (
          <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">#{o.id}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${s.bg} ${s.text}`}>
                    {s.icon} {s.label[locale as "th" | "en"]}
                  </span>
                </div>
                <div className="text-lg font-black uppercase text-slate-900">{o.plan}</div>
                <div className="text-xs text-slate-500">{fmtDate(o.created_at, locale)}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">฿{Number(o.amount).toLocaleString()}</div>
                {o.confirmed_at && (
                  <div className="text-xs text-slate-500">
                    {o.status === "confirmed"
                      ? (locale === "th" ? `ยืนยัน: ${fmtDate(o.confirmed_at, locale)}` : `Confirmed: ${fmtDate(o.confirmed_at, locale)}`)
                      : (locale === "th" ? `ปิด: ${fmtDate(o.confirmed_at, locale)}` : `Closed: ${fmtDate(o.confirmed_at, locale)}`)}
                  </div>
                )}
              </div>
            </div>
            {o.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                {o.notes}
              </div>
            )}
            {o.status === "pending" && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                <Clock size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  {locale === "th"
                    ? "Admin จะตรวจสอบสลิปและยืนยันภายใน 24 ชม. ในเวลาทำการ"
                    : "Admin will confirm within 24 h on business days."}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
