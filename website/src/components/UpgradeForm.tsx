"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, FileImage, AlertCircle, CheckCircle2, Loader2, Cpu } from "lucide-react";

type Plan = "monthly" | "yearly" | "lifetime";

export function UpgradeForm({
  locale, plan, amount, userEmail,
}: {
  locale: string;
  plan: Plan;
  amount: number;
  userEmail: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError(locale === "th" ? "ไฟล์ใหญ่เกิน 5 MB" : "File over 5 MB");
      return;
    }
    setError(null);
    setSlip(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!slip) {
      setError(locale === "th" ? "กรุณาแนบสลิปการโอน" : "Please attach the payment slip");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("plan", plan);
      fd.append("slip", slip);
      if (paymentRef) fd.append("payment_ref", paymentRef);
      if (notes) fd.append("notes", notes);
      if (hardwareId.trim()) fd.append("hardware_id", hardwareId.trim());
      const r = await fetch("/api/order/create", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        const msg = data?.message || data?.error || "unknown";
        setError(locale === "th"
          ? `เกิดข้อผิดพลาด: ${msg}`
          : `Error: ${msg}`);
        setBusy(false);
        return;
      }
      setOrderId(data.order.id);
    } catch {
      setError(locale === "th" ? "เครือข่ายขัดข้อง — ลองใหม่อีกครั้ง" : "Network error — try again");
      setBusy(false);
    }
  };

  if (orderId !== null) {
    // Success state
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border-2 border-emerald-200 p-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">
          {locale === "th" ? "ส่ง Order สำเร็จ!" : "Order submitted!"}
        </h3>
        <p className="text-slate-600 mb-1">
          {locale === "th" ? "เลขที่ Order:" : "Order #"} <strong className="text-slate-900">#{orderId}</strong>
        </p>
        <p className="text-sm text-slate-600 mb-6">
          {locale === "th"
            ? "Admin จะตรวจสอบสลิปและยืนยันภายใน 24 ชม. เมื่อยืนยันแล้วคุณจะได้รับอีเมลพร้อม License Key"
            : "Admin will review your slip within 24 h. You'll get an email with your license key once confirmed."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={`/${locale}/account`}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {locale === "th" ? "ไปบัญชีของฉัน" : "Go to My Account"}
          </Link>
          <Link
            href={`/${locale}/account/orders`}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all"
          >
            {locale === "th" ? "ดูประวัติ Order" : "View order history"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h3 className="font-black text-slate-900 mb-4">
        📄 {locale === "th" ? "อัปโหลดสลิปการโอน" : "Upload payment slip"}
      </h3>

      <div className="text-xs text-slate-600 mb-4">
        {locale === "th" ? "บัญชีของคุณ:" : "Your account:"} <strong>{userEmail}</strong>
      </div>

      {/* File input */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {locale === "th" ? "สลิป (รูป JPG / PNG / PDF)" : "Slip (JPG / PNG / PDF)"} <span className="text-rose-500">*</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            slip ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {slip ? (
            <div className="flex items-center justify-center gap-2">
              <FileImage size={20} className="text-emerald-600" />
              <span className="text-sm font-bold text-slate-900 truncate max-w-[260px]">{slip.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSlip(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-rose-600 hover:underline ml-1"
              >
                {locale === "th" ? "เปลี่ยน" : "change"}
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} className="mx-auto text-slate-400 mb-2" />
              <div className="text-sm text-slate-600">
                {locale === "th" ? "คลิกเพื่อเลือกไฟล์ หรือ ลากวางที่นี่" : "Click to choose, or drag a file here"}
              </div>
              <div className="text-xs text-slate-500 mt-1">{locale === "th" ? "สูงสุด 5 MB" : "max 5 MB"}</div>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Hardware ID — only relevant for plans that ship a license.dat */}
      {(plan === "yearly" || plan === "lifetime") && (
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Cpu size={14} className="text-blue-600" />
            {locale === "th" ? "Hardware ID (สำหรับผูก License)" : "Hardware ID (license binding)"}
            <span className="text-xs font-normal text-slate-500">
              ({locale === "th" ? "ถ้าไม่กรอก จะใช้ของเครื่องที่ Sign in ล่าสุด" : "leave blank to use last signed-in device"})
            </span>
          </label>
          <input
            type="text"
            value={hardwareId}
            onChange={(e) => setHardwareId(e.target.value)}
            placeholder="sha256:abcdef..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            {locale === "th"
              ? <>💡 หา Hardware ID ได้ที่ Desktop App → แท็บ <strong>"สิทธิ์การใช้งาน"</strong> → กดปุ่ม <strong>"คัดลอก"</strong> ข้าง Hardware ID</>
              : <>💡 Find your Hardware ID in Desktop App → <strong>License</strong> tab → click <strong>Copy</strong> next to Hardware ID</>}
          </p>
        </div>
      )}

      {/* Payment ref (optional) */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {locale === "th" ? "เลขอ้างอิงการโอน (ถ้ามี)" : "Reference number (optional)"}
        </label>
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder={locale === "th" ? "เช่น 12345678" : "e.g. 12345678"}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          {locale === "th" ? "หมายเหตุ (ถ้ามี)" : "Notes (optional)"}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={locale === "th" ? "เช่น ขอใบกำกับภาษี, ชื่อบริษัท..." : "e.g. tax invoice, company name..."}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !slip}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {locale === "th" ? "กำลังส่ง..." : "Submitting..."}
          </>
        ) : (
          <>
            {locale === "th" ? `ส่ง Order ฿${amount.toLocaleString()}` : `Submit Order ฿${amount.toLocaleString()}`}
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center mt-3">
        {locale === "th"
          ? "Admin จะยืนยันภายใน 24 ชม. ในเวลาทำการ"
          : "Admin will confirm within 24 h on business days"}
      </p>
    </form>
  );
}
