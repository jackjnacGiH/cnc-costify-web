"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export function ResendVerifyButton({ locale }: { locale: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
        credentials: "include",
      });
      if (r.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-emerald-700 font-bold">
        <CheckCircle2 size={16} />
        {locale === "th" ? "ส่งลิงก์ใหม่แล้ว — ตรวจสอบ inbox" : "Sent — check your inbox"}
      </div>
    );
  }
  return (
    <button
      onClick={handle}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-md disabled:opacity-50 transition-colors"
    >
      <Mail size={14} />
      {busy ? "..." : (locale === "th" ? "ส่งลิงก์ใหม่" : "Resend link")}
    </button>
  );
}
