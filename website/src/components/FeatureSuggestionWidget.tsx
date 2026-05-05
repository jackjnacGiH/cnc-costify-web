"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { Lightbulb, X, Send, Mail, CheckCircle2, AlertCircle, Star } from "lucide-react";

const CATEGORIES = [
  "newFeature", "improvement", "bugReport", "uiux", "integration", "performance", "other",
] as const;

type FormState = {
  category: string;
  title: string;
  description: string;
  importance: number;
  name: string;
  email: string;
};

const initialState: FormState = {
  category: "",
  title: "",
  description: "",
  importance: 3,
  name: "",
  email: "",
};

export function FeatureSuggestionWidget() {
  const t = useTranslations("Feedback");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  // Restore draft from localStorage so users don't lose typing
  useEffect(() => {
    if (open) {
      try {
        const draft = localStorage.getItem("feedbackDraft");
        if (draft) setForm({ ...initialState, ...JSON.parse(draft) });
      } catch { /* ignore */ }
    }
  }, [open]);

  // Save draft as user types
  useEffect(() => {
    if (status === "idle" && (form.title || form.description)) {
      localStorage.setItem("feedbackDraft", JSON.stringify(form));
    }
  }, [form, status]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.category) e.category = t("validation.categoryRequired");
    if (!form.title.trim()) e.title = t("validation.titleRequired");
    if (!form.description.trim()) e.description = t("validation.descriptionRequired");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t("validation.emailInvalid");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      // POST to backend — saves to SQLite database (data/cnc.db)
      const resp = await fetch("/api/feedback/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          locale,
          page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        throw new Error(data?.message || data?.error || `HTTP ${resp.status}`);
      }
      setStatus("success");
      localStorage.removeItem("feedbackDraft");
      setTimeout(() => {
        setForm(initialState);
        setOpen(false);
        setStatus("idle");
      }, 3500);
    } catch (e) {
      console.error("[feedback] submit failed:", e);
      setStatus("error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStatus("idle");
    setErrors({});
  };

  return (
    <>
      {/* Floating button — bottom-right on every page */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("buttonLabel")}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 pl-4 pr-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-110 transition-all"
      >
        <Lightbulb size={20} className="group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-sm">{t("buttonLabel")}</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in-up"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <div>
                <h2 className="text-lg sm:text-xl font-black">{t("title")}</h2>
                <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-md">{t("subtitle")}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Success state */}
            {status === "success" && (
              <div className="p-8 text-center">
                <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">{t("successTitle")}</h3>
                <p className="text-slate-600 mb-4">{t("successMsg")}</p>
                <p className="text-sm text-slate-500">
                  {t("altMethod")}{" "}
                  <a href="mailto:info@cnccostify.cloud" className="text-blue-600 hover:underline font-bold">
                    info@cnccostify.cloud
                  </a>
                </p>
              </div>
            )}

            {/* Form */}
            {status !== "success" && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fields.category")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.category ? "border-rose-400" : "border-slate-300"
                    }`}
                  >
                    <option value="">{t("fields.categoryPlaceholder")}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`fields.categories.${c}`)}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fields.title")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t("fields.titlePlaceholder")}
                    maxLength={120}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.title ? "border-rose-400" : "border-slate-300"
                    }`}
                  />
                  {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fields.description")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t("fields.descriptionPlaceholder")}
                    rows={4}
                    maxLength={2000}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.description ? "border-rose-400" : "border-slate-300"
                    }`}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    {errors.description ? (
                      <span className="text-rose-600">{errors.description}</span>
                    ) : <span />}
                    <span className="text-slate-400">{form.description.length}/2000</span>
                  </div>
                </div>

                {/* Importance */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {t("fields.importance")}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, importance: n })}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                          n <= form.importance
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        <Star size={14} className="inline mb-0.5" fill={n <= form.importance ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 text-center">
                    {t(`fields.importanceLevels.${form.importance}` as never)}
                  </p>
                </div>

                {/* Name + Email */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {t("fields.name")}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t("fields.namePlaceholder")}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {t("fields.email")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t("fields.emailPlaceholder")}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.email ? "border-rose-400" : "border-slate-300"
                      }`}
                    />
                    {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>{t("errorMsg")}</span>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <a
                    href="mailto:info@cnccostify.cloud"
                    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Mail size={14} />
                    {t("altMethod")}
                  </a>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                  >
                    <Send size={16} />
                    {status === "sending" ? t("sending") : t("send")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
