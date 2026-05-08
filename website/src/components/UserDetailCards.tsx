"use client";
import { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon, Mail, Building2, Phone, KeyRound, ShoppingBag,
  Monitor, Activity, Download, X, Loader2, AlertCircle,
} from "lucide-react";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  plan: string;
  plan_expires_at: number | null;
  verified: number;
  created_at: number;
  last_login_at: number | null;
  last_ip: string | null;
};

type Order = {
  id: number;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  payment_ref: string | null;
  hardware_id: string | null;
  created_at: number;
  confirmed_at: number | null;
  notes: string | null;
};

type License = {
  id: number;
  license_key: string;
  plan: string;
  hardware_id: string | null;
  valid_from: number;
  valid_until: number | null;
  revoked: number;
  created_at: number;
};

type Device = {
  id: number;
  device_name: string | null;
  os: string | null;
  app_version: string | null;
  hardware_id: string | null;
  local_license_status: string | null;
  local_license_days_left: number | null;
  created_at: number;
  last_used_at: number | null;
  last_ip: string | null;
  revoked: number;
};

type Detail = {
  user: UserRow;
  orders: Order[];
  licenses: License[];
  devices: Device[];
  usage_today: number;
};

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  monthly: "bg-blue-100 text-blue-700",
  yearly: "bg-purple-100 text-purple-700",
  lifetime: "bg-amber-100 text-amber-800",
};

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-100 text-slate-600",
};

function fmtDate(ms: number | null, locale: string): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ms));
}

export function UserDetailCards({ locale, initial }: { locale: string; initial: Detail }) {
  const [data, setData] = useState<Detail>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch(`/api/admin/users/${data.user.id}`, { credentials: "include", cache: "no-store" });
      const json = await r.json().catch(() => ({}));
      if (r.ok && json.ok) setData(json);
    } catch { /* ignore */ }
  };

  const revokeLicense = async (id: number) => {
    const reason = prompt(locale === "th" ? "เหตุผลการ revoke license:" : "Revoke reason:");
    if (reason === null) return;
    setBusy(`lic-${id}`);
    setError(null);
    try {
      const r = await fetch(`/api/admin/licenses/${id}/revoke`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.ok) setError(json?.error || "revoke_failed");
      else await refresh();
    } finally {
      setBusy(null);
    }
  };

  const revokeDevice = async (id: number) => {
    if (!confirm(locale === "th" ? "ยืนยันยกเลิกอุปกรณ์นี้?" : "Revoke this device?")) return;
    setBusy(`dev-${id}`);
    setError(null);
    try {
      const r = await fetch(`/api/admin/devices/${id}/revoke`, {
        method: "POST", credentials: "include",
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.ok) setError(json?.error || "revoke_failed");
      else await refresh();
    } finally {
      setBusy(null);
    }
  };

  const u = data.user;
  const isLifetime = u.plan === "lifetime" && !u.plan_expires_at;
  const daysLeft = !isLifetime && u.plan_expires_at
    ? Math.max(0, Math.ceil((u.plan_expires_at - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile + Plan */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" />
            {locale === "th" ? "ข้อมูลผู้ใช้" : "Profile"}
          </h2>
          <div className="space-y-2 text-sm">
            <Field icon={Mail} label={locale === "th" ? "อีเมล" : "Email"} value={u.email} />
            <Field icon={UserIcon} label={locale === "th" ? "ชื่อ" : "Name"} value={u.name || "—"} />
            <Field icon={Building2} label={locale === "th" ? "บริษัท" : "Company"} value={u.company || "—"} />
            <Field icon={Phone} label={locale === "th" ? "เบอร์" : "Phone"} value={u.phone || "—"} />
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t">
              <span>ID: {u.id}</span>
              <span>·</span>
              <span>{u.verified ? "✓ verified" : "✗ unverified"}</span>
              {u.last_ip && <><span>·</span><span>{u.last_ip}</span></>}
            </div>
            <div className="text-xs text-slate-500">
              {locale === "th" ? "สมัคร" : "Joined"}: {fmtDate(u.created_at, locale)} · {locale === "th" ? "เข้าใช้ล่าสุด" : "Last login"}: {fmtDate(u.last_login_at, locale)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
            <KeyRound size={18} className="text-purple-600" />
            {locale === "th" ? "แพ็กเกจปัจจุบัน" : "Current Plan"}
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-block px-3 py-1 rounded-lg uppercase font-black text-base ${PLAN_BADGE[u.plan] || PLAN_BADGE.free}`}>
              {u.plan}
            </span>
            {isLifetime && <span className="text-amber-700 font-bold">♾️</span>}
          </div>
          {!isLifetime && u.plan_expires_at && (
            <div className="text-sm text-slate-700">
              {locale === "th" ? "หมดอายุ" : "Expires"}: <strong>{fmtDate(u.plan_expires_at, locale)}</strong>
              {daysLeft !== null && <span className="text-emerald-700 ml-1">({daysLeft} {locale === "th" ? "วัน" : "days"})</span>}
            </div>
          )}
          <div className="text-sm text-slate-600 mt-2 flex items-center gap-1.5">
            <Activity size={14} className="text-blue-600" />
            {locale === "th" ? "วันนี้ใช้ไป" : "Today's usage"}: <strong>{data.usage_today}</strong> {locale === "th" ? "ไฟล์" : "files"}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href={`/${locale}/admin/license?user_id=${u.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-sm font-bold rounded-lg hover:opacity-95"
            >
              <KeyRound size={14} />
              {locale === "th" ? "ออก License ให้ผู้ใช้นี้" : "Generate License for this user"}
            </Link>
          </div>
        </div>
      </div>

      {/* Licenses */}
      <Card title={locale === "th" ? "License Keys" : "License Keys"} icon={KeyRound} count={data.licenses.length}>
        {data.licenses.length === 0 ? (
          <Empty message={locale === "th" ? "ยังไม่มี license" : "No licenses yet"} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Key</Th><Th>Plan</Th><Th>Hardware ID</Th><Th>{locale === "th" ? "ใช้ได้ถึง" : "Valid until"}</Th>
                <Th>{locale === "th" ? "สถานะ" : "Status"}</Th><Th>{locale === "th" ? "การจัดการ" : "Actions"}</Th>
              </tr>
            </thead>
            <tbody>
              {data.licenses.map((lic) => (
                <tr key={lic.id} className={`border-t border-slate-100 ${lic.revoked ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2 font-mono text-xs">{lic.license_key}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold ${PLAN_BADGE[lic.plan]}`}>{lic.plan}</span></td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500 max-w-[180px] truncate" title={lic.hardware_id || ""}>{lic.hardware_id || "—"}</td>
                  <td className="px-3 py-2 text-xs">{lic.valid_until ? fmtDate(lic.valid_until, locale) : "♾️"}</td>
                  <td className="px-3 py-2">
                    {lic.revoked
                      ? <span className="text-xs text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">{locale === "th" ? "ถูกเพิกถอน" : "Revoked"}</span>
                      : <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{locale === "th" ? "ใช้งานได้" : "Active"}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <a
                        href={`/api/admin/licenses/${lic.id}/dat`}
                        download={`license-${lic.license_key}.dat`}
                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                        title={locale === "th" ? "ดาวน์โหลด" : "Download"}
                      ><Download size={12} /></a>
                      {!lic.revoked && (
                        <button
                          onClick={() => revokeLicense(lic.id)}
                          disabled={busy === `lic-${lic.id}`}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded disabled:opacity-50"
                          title={locale === "th" ? "เพิกถอน" : "Revoke"}
                        >{busy === `lic-${lic.id}` ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Orders */}
      <Card title={locale === "th" ? "ประวัติคำสั่งซื้อ" : "Order History"} icon={ShoppingBag} count={data.orders.length}>
        {data.orders.length === 0 ? (
          <Empty message={locale === "th" ? "ยังไม่มีคำสั่งซื้อ" : "No orders yet"} />
        ) : (
          <Table>
            <thead>
              <tr><Th>#</Th><Th>Plan</Th><Th className="text-right">{locale === "th" ? "ยอด" : "Amount"}</Th>
                <Th>{locale === "th" ? "สถานะ" : "Status"}</Th><Th>{locale === "th" ? "วันที่" : "Date"}</Th></tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs font-mono text-slate-500">{o.id}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold ${PLAN_BADGE[o.plan]}`}>{o.plan}</span></td>
                  <td className="px-3 py-2 text-right font-bold">฿{Number(o.amount).toLocaleString()}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] || ORDER_STATUS_BADGE.pending}`}>{o.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-600">{fmtDate(o.created_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Devices */}
      <Card title={locale === "th" ? "อุปกรณ์ที่เชื่อมต่อ" : "Connected Devices"} icon={Monitor} count={data.devices.length}>
        {data.devices.length === 0 ? (
          <Empty message={locale === "th" ? "ยังไม่มีอุปกรณ์" : "No devices yet"} />
        ) : (
          <Table>
            <thead>
              <tr><Th>{locale === "th" ? "ชื่อ" : "Name"}</Th><Th>OS / Version</Th>
                <Th>Hardware ID</Th><Th>{locale === "th" ? "ใช้ล่าสุด" : "Last used"}</Th>
                <Th>{locale === "th" ? "สถานะ" : "Status"}</Th><Th>{locale === "th" ? "การจัดการ" : "Actions"}</Th></tr>
            </thead>
            <tbody>
              {data.devices.map((d) => (
                <tr key={d.id} className={`border-t border-slate-100 ${d.revoked ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2 text-sm">{d.device_name || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{d.os || "—"} {d.app_version && `· v${d.app_version}`}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500 max-w-[180px] truncate" title={d.hardware_id || ""}>{d.hardware_id || "—"}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(d.last_used_at, locale)}</td>
                  <td className="px-3 py-2">
                    {d.revoked
                      ? <span className="text-xs text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">{locale === "th" ? "ยกเลิกแล้ว" : "Revoked"}</span>
                      : <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{locale === "th" ? "ใช้งานได้" : "Active"}</span>}
                  </td>
                  <td className="px-3 py-2">
                    {!d.revoked && (
                      <button
                        onClick={() => revokeDevice(d.id)}
                        disabled={busy === `dev-${d.id}`}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded disabled:opacity-50"
                        title={locale === "th" ? "ยกเลิก" : "Revoke"}
                      >{busy === `dev-${d.id}` ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900 truncate">{value}</div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, count, children }: { title: string; icon: React.ElementType; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Icon size={16} className="text-slate-700" />
        <h2 className="font-black text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">({count})</span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-bold text-xs uppercase text-slate-500 bg-slate-50 ${className}`}>{children}</th>;
}
function Empty({ message }: { message: string }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-500">{message}</div>;
}
