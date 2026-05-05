"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Building2, Phone, AlertCircle, ArrowRight } from "lucide-react";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    company: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? form
        : { email: form.email, password: form.password };
      const resp = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        const code = data?.error || "unknown";
        const knownErrors = ["invalid_email", "password_too_short", "email_already_registered", "invalid_credentials", "rate_limit"];
        const errorKey = knownErrors.includes(code) ? code : "unknown";
        setError(t(`errors.${errorKey}`));
        setBusy(false);
        return;
      }
      // Success → redirect to /account
      router.push(`/${locale}/account`);
      router.refresh();
    } catch {
      setError(t("errors.network"));
      setBusy(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          {isSignup ? t("signupTitle") : t("loginTitle")}
        </h1>
        <p className="text-sm text-slate-600">
          {isSignup ? t("signupSubtitle") : t("loginSubtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("name")}</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("email")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t("emailPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("password")} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t("passwordPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isSignup && (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("company")}</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder={t("companyPlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("phone")}</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={t("phonePlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {!isSignup && (
          <div className="text-right">
            <Link href={`/${locale}/forgot-password`} className="text-xs text-blue-600 hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {busy ? "..." : (isSignup ? t("signupBtn") : t("loginBtn"))}
          {!busy && <ArrowRight size={18} />}
        </button>

        {isSignup && (
          <p className="text-xs text-slate-500 text-center">
            {t("agreeTerms")}{" "}
            <Link href={`/${locale}/terms`} className="text-blue-600 hover:underline">{t("termsLink")}</Link>
            {" "}{t("and")}{" "}
            <Link href={`/${locale}/privacy`} className="text-blue-600 hover:underline">{t("privacyLink")}</Link>
          </p>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
        {isSignup ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={`/${locale}/${isSignup ? "login" : "signup"}`}
          className="text-blue-600 hover:underline font-bold"
        >
          {isSignup ? t("loginLink") : t("signupLink")}
        </Link>
      </div>
    </div>
  );
}
