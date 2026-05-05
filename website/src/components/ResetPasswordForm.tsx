"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export function ResetPasswordForm({ token, locale }: { token: string | null; locale: string }) {
  const t = useTranslations("Reset");
  const tAuth = useTranslations("Auth");
  const tErr = useTranslations("Auth.errors");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">{t("title")}</h1>
        <p className="text-slate-600 mb-6">{t("missingToken")}</p>
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          {tAuth("forgotPassword")}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("passwordsMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(tErr("password_too_short"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) {
        const code = data?.error || "unknown";
        const known = ["invalid_token", "token_expired", "password_too_short"];
        setError(tErr(known.includes(code) ? code : "unknown"));
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:scale-105 transition-all"
        >
          {tAuth("loginBtn")}
          <ArrowRight size={16} />
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
            {t("newPassword")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tAuth("passwordPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("confirmPassword")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={tAuth("passwordPlaceholder")}
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
    </div>
  );
}
