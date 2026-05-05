"use client";
import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function DesktopAuthForm({ code, locale }: { code: string; locale: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [errCode, setErrCode] = useState<string>("");

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
        // Try opening the custom URL scheme so the desktop app foregrounds itself
        // (desktop will already be polling the exchange endpoint and will close this loop on success)
        try {
          window.location.href = `cnc-costify://auth-complete?code=${encodeURIComponent(code)}`;
        } catch {
          /* ignore — user can also just switch back manually */
        }
      } else {
        setState("err");
        setErrCode(data?.error || "unknown");
      }
    } catch {
      setState("err");
      setErrCode("network");
    }
  };

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

  return (
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
        locale === "th" ? "อนุญาตให้ Desktop App เข้าถึงบัญชี" : "Authorize Desktop App"
      )}
    </button>
  );
}
