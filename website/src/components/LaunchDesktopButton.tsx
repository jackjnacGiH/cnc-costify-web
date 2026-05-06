"use client";
import { useState } from "react";
import Link from "next/link";
import { Rocket, Download } from "lucide-react";

/**
 * Launch the Desktop App via cnc-costify:// custom protocol.
 *
 * Behavior:
 *  - Click → tries to open `cnc-costify://launch`
 *  - If Desktop app v5.1+ installed → it foregrounds (handler registered on install)
 *  - If not installed → browser silently ignores the navigation, then we redirect
 *    the user to /download after a short timeout (~1.5s) since nothing happened.
 *
 * Note: there's no reliable way to detect "did the OS open the protocol?" from
 * a web page; we just assume failure if focus stays on this tab.
 */
export function LaunchDesktopButton({ locale }: { locale: string }) {
  const [busy, setBusy] = useState(false);

  const handleLaunch = () => {
    setBusy(true);
    // Attempt the deep-link
    const href = "cnc-costify://launch";
    try {
      window.location.href = href;
    } catch {
      /* ignore — most browsers throw silently for unregistered schemes */
    }
    // Fallback: if still on this page after ~1.5s, suggest download.
    // (If the app launched, the user has switched to it and won't see this.)
    setTimeout(() => {
      setBusy(false);
      const goDownload = confirm(
        locale === "th"
          ? "ยังไม่ได้ติดตั้ง CNC Costify AI Desktop?\n\nกด OK เพื่อไปหน้าดาวน์โหลด"
          : "CNC Costify AI Desktop not installed?\n\nClick OK to go to the download page",
      );
      if (goDownload) window.location.href = `/${locale}/download`;
    }, 1500);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleLaunch}
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
      >
        <Rocket size={16} />
        {busy
          ? locale === "th" ? "กำลังเปิด..." : "Opening..."
          : locale === "th" ? "เปิดโปรแกรม Desktop" : "Open Desktop App"}
      </button>
      <Link
        href={`/${locale}/download`}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-lg transition-all"
      >
        <Download size={16} />
        {locale === "th" ? "ดาวน์โหลด" : "Download"}
      </Link>
    </div>
  );
}
