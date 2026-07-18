"use client";
import { useEffect, useState } from "react";
import { Monitor, Trash2, Loader2 } from "lucide-react";

type Device = {
  id: number;
  device_name: string | null;
  os: string | null;
  app_version: string | null;
  created_at: number;
  last_used_at: number | null;
  last_ip: string | null;
  revoked: number;
};

function formatRel(ms: number | null, locale: string): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (locale === "th") {
    if (d > 0) return `${d} วันที่แล้ว`;
    if (h > 0) return `${h} ชม.ที่แล้ว`;
    if (m > 0) return `${m} นาทีที่แล้ว`;
    return "เมื่อสักครู่";
  }
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function AccountDevicesCard({ locale }: { locale: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/account/devices", { credentials: "include", cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) setDevices(data.devices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: number) => {
    if (!confirm(locale === "th" ? "ยกเลิกการเข้าถึงของอุปกรณ์นี้?" : "Revoke this device?")) return;
    setRevoking(id);
    try {
      await fetch(`/api/account/devices/${id}/revoke`, { method: "POST", credentials: "include" });
      await load();
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <div className="h-4 bg-slate-100 rounded w-32 mb-3 animate-pulse" />
        <div className="h-12 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Monitor size={20} className="text-blue-600" />
        <h2 className="text-xl font-black text-slate-900">
          {locale === "th" ? "อุปกรณ์ที่เชื่อมต่อ" : "Connected Devices"}
        </h2>
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-slate-500">
          {locale === "th"
            ? "ยังไม่มี Desktop App เชื่อมต่อ — ดาวน์โหลดและเปิดแอปแล้วกด \"Sign In\""
            : "No Desktop App connected yet — install and open the app, then click \"Sign In\"."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {devices.map((d) => (
            <li key={d.id} className={`py-3 flex items-center justify-between gap-4 ${d.revoked ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {d.device_name || (locale === "th" ? "อุปกรณ์ไม่ระบุชื่อ" : "Unnamed device")}
                  {d.os && <span className="ml-2 text-xs font-normal text-slate-500">({d.os}{d.app_version ? ` · v${d.app_version}` : ""})</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {locale === "th" ? "ใช้งานล่าสุด: " : "Last used: "}
                  {formatRel(d.last_used_at, locale)}
                  {d.revoked === 1 && (
                    <span className="ml-2 text-rose-600 font-bold">
                      ({locale === "th" ? "ยกเลิกแล้ว" : "revoked"})
                    </span>
                  )}
                </div>
              </div>
              {d.revoked === 0 && (
                <button
                  onClick={() => handleRevoke(d.id)}
                  disabled={revoking === d.id}
                  className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                  title={locale === "th" ? "ยกเลิกการเข้าถึง" : "Revoke"}
                >
                  {revoking === d.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
