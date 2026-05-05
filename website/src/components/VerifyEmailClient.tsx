"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";

type Status = "loading" | "success" | "error" | "missing_token";

export function VerifyEmailClient({ token, locale }: { token: string | null; locale: string }) {
  const t = useTranslations("Verify");
  const tErr = useTranslations("Auth.errors");
  const [status, setStatus] = useState<Status>(token ? "loading" : "missing_token");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, locale }),
    })
      .then((r) => r.json().then((d) => ({ status: r.status, data: d })))
      .then(({ status: s, data }) => {
        if (s === 200 && data.ok) {
          setStatus("success");
        } else {
          const code = data?.error || "unknown";
          const known = ["invalid_or_expired_token", "missing_token", "invalid_token"];
          setErrorMsg(tErr(known.includes(code) ? code : "unknown"));
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg(tErr("network"));
        setStatus("error");
      });
  }, [token, locale, tErr]);

  const handleResend = async () => {
    setResendBusy(true);
    try {
      const r = await fetch("/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
        credentials: "include",
      });
      if (r.ok) setResendOk(true);
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
      {status === "loading" && (
        <>
          <Loader2 size={56} className="mx-auto text-blue-500 animate-spin mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t("loading")}</h1>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t("success")}</h1>
          <p className="text-slate-600 mb-6">{t("successMsg")}</p>
          <Link
            href={`/${locale}/account`}
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:scale-105 transition-all"
          >
            {t("goToAccount")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle size={64} className="mx-auto text-rose-500 mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t("errorTitle")}</h1>
          <p className="text-slate-600 mb-6">{errorMsg}</p>
          {resendOk ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
              <Mail size={18} /> {t("resendSuccess")}
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendBusy}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:scale-105 disabled:opacity-50 transition-all"
            >
              <Mail size={18} />
              {resendBusy ? "..." : t("resendBtn")}
            </button>
          )}
        </>
      )}

      {status === "missing_token" && (
        <>
          <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t("errorTitle")}</h1>
          <p className="text-slate-600">{t("missingToken")}</p>
        </>
      )}
    </div>
  );
}
