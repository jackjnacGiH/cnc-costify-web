"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("Forgot");
  const tAuth = useTranslations("Auth");
  const tErr = useTranslations("Auth.errors");

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        const code = data?.error || "unknown";
        setError(tErr(["rate_limit", "missing_email"].includes(code) ? code : "unknown"));
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError(tErr("network"));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">{t("successTitle")}</h1>
        <p className="text-slate-600 mb-6">{t("successMsg")}</p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline font-bold"
        >
          <ArrowLeft size={16} />
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">{t("title")}</h1>
      <p className="text-sm text-slate-600 text-center mb-6">{t("subtitle")}</p>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {tAuth("email")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tAuth("emailPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 transition-all"
        >
          {busy ? "..." : t("submitBtn")}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={14} />
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
