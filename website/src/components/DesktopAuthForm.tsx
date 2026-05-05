"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Cpu, Monitor as MonitorIcon, Tag } from "lucide-react";

type CodeInfo = {
  hardware_id: string | null;
  os: string | null;
  app_version: string | null;
  device_name: string | null;
  expired: boolean;
  authorized: boolean;
  consumed: boolean;
};

export function DesktopAuthForm({ code, locale }: { code: string; locale: string }) {
  const [state, setState] = useState<"loading" | "idle" | "busy" | "ok" | "err">("loading");
  const [errCode, setErrCode] = useState<string>("");
  const [info, setInfo] = useState<CodeInfo | null>(null);

  // Fetch code metadata so we can display HW ID
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/desktop/auth-link/info?code=${encodeURIComponent(code)}`, { cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok || !data.ok) {
          setErrCode(data?.error || "code_not_found");
          setState("err");
          return;
        }
        const i = data.info as CodeInfo;
        setInfo(i);
        if (i.expired) { setErrCode("code_expired"); setState("err"); return; }
        if (i.consumed) { setErrCode("code_already_used"); setState("err"); return; }
        if (i.authorized) { setErrCode("code_already_authorized"); setState("err"); return; }
        setState("idle");
      } catch {
        if (!cancelled) { setErrCode("network"); setState("err"); }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  const handleAuthorize = async () => {
    setState("busy");
    try {
      const r = await fetch("/api/desktop/auth-link/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setState("ok");
        try { window.location.href = `cnc-costify://auth-complete?code=${encodeURIComponent(code)}`; } catch {}
      } else {
        setState("err");
        setErrCode(data?.error || "unknown");
      }
    } catch {
      setState("err");
      setErrCode("network");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-6 text-slate-500 text-sm">
        <Loader2 size={18} className="animate-spin mr-2" />
        {locale === "th" ? "กำลังโหลดข้อมูลอุปกรณ์..." : "Loading device info..."}
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-900 mb-1">
            {locale === "th" ? "เชื่อมต่อสำเร็จ!" : "Connected successfully!"}
          </div>
          <div className="text-sm text-emerald-800">
            {locale === "th"
              ? "กลับไปที่ CNC Costify AI Desktop ได้เลย — แอปจะเข้าสู่ระบบให้อัตโนมัติภายในไม่กี่วินาที"
              : "Switch back to CNC Costify AI Desktop — it will sign in automatically within a few seconds."}
          </div>
        </div>
      </div>
    );
  }

  if (state === "err") {
    const messages: Record<string, { th: string; en: string }> = {
      code_not_found: { th: "ไม่พบรหัสนี้ในระบบ", en: "Code not found." },
      code_expired: { th: "รหัสหมดอายุแล้ว — กรุณาลองใหม่จาก Desktop App", en: "Code expired — please try again from Desktop App." },
      code_already_used: { th: "รหัสนี้ถูกใช้ไปแล้ว", en: "This code has already been used." },
      code_already_authorized: { th: "รหัสนี้ถูกอนุญาตไปแล้ว", en: "This code is already authorized." },
      missing_hardware_id: { th: "ไม่พบ Hardware ID — กรุณาเปิด Desktop App ใหม่", en: "Missing Hardware ID — please reopen Desktop App." },
      network: { th: "เครือข่ายขัดข้อง — ลองใหม่อีกครั้ง", en: "Network error — please try again." },
      unknown: { th: "เกิดข้อผิดพลาด", en: "Something went wrong." },
    };
    const m = messages[errCode] || messages.unknown;
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={22} className="text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-rose-900 mb-1">
            {locale === "th" ? "ไม่สามารถเชื่อมต่อได้" : "Unable to authorize"}
          </div>
          <div className="text-sm text-rose-800">{locale === "th" ? m.th : m.en}</div>
        </div>
      </div>
    );
  }

  // idle / busy — show device info + authorize button
  const hwShort = info?.hardware_id ? info.hardware_id.replace(/^sha256:/, "").slice(0, 16) + "..." : "—";

  return (
    <>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-5 space-y-3">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
          {locale === "th" ? "ข้อมูลอุปกรณ์ที่จะเชื่อมต่อ" : "Device to authorize"}
        </div>
        <InfoRow icon={Cpu} label="Hardware ID" value={hwShort} mono />
        <InfoRow icon={MonitorIcon} label="OS" value={info?.os || "—"} />
        <InfoRow icon={Tag} label={locale === "th" ? "เวอร์ชั่น" : "Version"} value={info?.app_version || "—"} />
        {info?.device_name && (
          <InfoRow icon={MonitorIcon} label={locale === "th" ? "ชื่ออุปกรณ์" : "Device"} value={info.device_name} />
        )}
      </div>

      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        {locale === "th"
          ? "⚠️ Hardware ID นี้จะถูกผูกกับบัญชีของคุณ — ใช้งานได้ 1 บัญชีต่อ 1 เครื่อง หากเคยลงทะเบียนเครื่องนี้ไว้กับบัญชีอื่น token เดิมจะถูกยกเลิก"
          : "⚠️ This Hardware ID will be bound to your account — 1 account per machine. If this machine was previously registered to another account, the old token will be revoked."}
      </p>

      <button
        onClick={handleAuthorize}
        disabled={state === "busy"}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
      >
        {state === "busy" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {locale === "th" ? "กำลังอนุญาต..." : "Authorizing..."}
          </>
        ) : (
          locale === "th" ? "อนุญาตให้เครื่องนี้เข้าใช้งาน" : "Authorize this device"
        )}
      </button>
    </>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={14} className="text-slate-400 flex-shrink-0" />
      <span className="text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className={`font-medium text-slate-900 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
