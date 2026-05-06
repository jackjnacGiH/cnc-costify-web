"use client";
import { useState } from "react";
import Link from "next/link";
import { Rocket, Download } from "lucide-react";

/**
 * Launch the Desktop App via cnc-costify:// custom protocol.
 *
 * Detection strategy:
 *  - Listen for `visibilitychange`. If the OS hands focus to the desktop app,
 *    the browser tab becomes hidden — that's our success signal.
 *  - If the page is still visible after the timeout, the scheme handler
 *    almost certainly didn't fire → suggest /download.
 *  - We also stop the fallback prompt if the page is `pagehide`d for any
 *    reason, to avoid false negatives.
 */
export function LaunchDesktopButton({ locale }: { locale: string }) {
  const [busy, setBusy] = useState(false);

  const handleLaunch = () => {
    setBusy(true);
    let appOpened = false;
    const cleanup = () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("blur", onBlur);
    };
    const onVisibility = () => { if (document.hidden) appOpened = true; };
    const onPageHide = () => { appOpened = true; };
    const onBlur = () => { appOpened = true; };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("blur", onBlur);

    try { window.location.href = "cnc-costify://launch"; } catch { /* ignored */ }

    // Give the OS up to ~2.5s to hand off focus to the desktop app.
    window.setTimeout(() => {
      cleanup();
      setBusy(false);
      if (appOpened) return; // desktop opened → say nothing
      const goDownload = confirm(
        locale === "th"
          ? "ยังไม่ได้ติดตั้ง CNC Costify AI Desktop?\n\nกด OK เพื่อไปหน้าดาวน์โหลด"
          : "CNC Costify AI Desktop not installed?\n\nClick OK to go to the download page",
      );
      if (goDownload) window.location.href = `/${locale}/download`;
    }, 2500);
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
