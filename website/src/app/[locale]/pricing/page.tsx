import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Check, X, Zap, Crown, Sparkles, Star, Gem } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Props = { params: Promise<{ locale: string }> };

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingContent locale={locale} />;
}

// All packages install on Desktop. Free/Monthly require an internet connection
// (server enforces quota / verifies subscription); Yearly/Lifetime ship a
// license.dat for full offline use.
const TIERS = [
  {
    key: "free",
    icon: Zap,
    color: "slate",
    gradient: "from-slate-100 to-white",
    border: "border-slate-300",
    button: "bg-slate-900 hover:bg-slate-800 text-white",
    originalPrice: null,
    promoPrice: 0,
    suffix: { th: "ตลอดไป", en: "Forever" },
    filesPerDay: { th: "3 ไฟล์/วัน", en: "3 files/day" },
    desktop: true,
    offline: false,
    duration: "forever",
    license: false,
    href: "/signup",
  },
  {
    key: "monthly",
    icon: Star,
    color: "blue",
    gradient: "from-blue-50 to-cyan-50",
    border: "border-blue-300",
    button: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white",
    originalPrice: 890,
    promoPrice: 445,
    suffix: { th: "/เดือน", en: "/mo" },
    filesPerDay: { th: "30 ไฟล์/วัน", en: "30 files/day" },
    desktop: true,
    offline: false,
    duration: "days30",
    license: false,
    href: "/upgrade?plan=monthly",
    popular: true,
  },
  {
    key: "yearly",
    icon: Gem,
    color: "purple",
    gradient: "from-purple-50 to-pink-50",
    border: "border-purple-400",
    button: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white",
    originalPrice: 8900,
    promoPrice: 4450,
    suffix: { th: "/ปี", en: "/yr" },
    filesPerDay: { th: "ไม่จำกัด", en: "Unlimited" },
    desktop: true,
    offline: true,
    duration: "days365",
    license: true,
    href: "/upgrade?plan=yearly",
    bestValue: true,
  },
  {
    key: "lifetime",
    icon: Crown,
    color: "amber",
    gradient: "from-amber-50 to-orange-50",
    border: "border-amber-400",
    button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    originalPrice: 89000,
    promoPrice: 44500,
    suffix: { th: "ครั้งเดียว", en: "Once" },
    filesPerDay: { th: "ไม่จำกัด", en: "Unlimited" },
    desktop: true,
    offline: true,
    duration: "lifetime",
    license: true,
    href: "/upgrade?plan=lifetime",
  },
] as const;

// ฟีเจอร์ที่ทุกแพ็กเกจได้ (รวม Free)
const FEATURES_ALL = [
  "step", "ai", "calc", "matdb", "excel", "process",
  "precision", "lang", "zoom", "support",
] as const;

// ฟีเจอร์เฉพาะแพ็กเกจจ่ายเงิน (ไม่มีใน Free)
const FEATURES_PAID = ["pdfjpg", "multiai", "chat"] as const;

function formatTHB(n: number): string {
  return new Intl.NumberFormat("th-TH").format(n);
}

function PricingContent({ locale }: { locale: string }) {
  const t = useTranslations("Pricing");

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="relative bg-gradient-to-b from-blue-50 via-white to-slate-50 pt-16 pb-12">
        <div className="absolute inset-0 bg-grid-slate opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 border border-rose-300 rounded-full text-sm font-bold text-rose-700 mb-6 animate-fade-in-up">
            <Sparkles size={16} />
            {t("promoBadge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t("subtitle")}</p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-slate-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isPopular = "popular" in tier && tier.popular;
              const isBestValue = "bestValue" in tier && tier.bestValue;
              // Per-tier hover glow color (matches the tier's accent)
              const hoverGlow: Record<string, string> = {
                slate:  "hover:shadow-slate-400/30 hover:border-slate-400",
                blue:   "hover:shadow-blue-500/40  hover:border-blue-500",
                purple: "hover:shadow-purple-500/40 hover:border-purple-500",
                amber:  "hover:shadow-amber-500/40 hover:border-amber-500",
              };
              return (
                <div
                  key={tier.key}
                  className={`group relative bg-gradient-to-br ${tier.gradient} border-2 ${tier.border} rounded-2xl p-6 ${
                    isPopular || isBestValue ? "shadow-2xl scale-105 z-10" : "shadow-md"
                  } transition-all duration-300 ease-out
                     hover:-translate-y-2 hover:shadow-2xl ${hoverGlow[tier.color] || ""}
                     ${isPopular || isBestValue ? "hover:scale-[1.08]" : "hover:scale-[1.03]"}
                     cursor-pointer`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
                      ⭐ {locale === "th" ? "ยอดนิยม" : "Popular"}
                    </div>
                  )}
                  {isBestValue && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                      💎 {locale === "th" ? "คุ้มที่สุด" : "Best Value"}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={28} className={`text-${tier.color}-600 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6`} />
                    <h3 className="text-2xl font-black text-slate-900 transition-colors group-hover:text-slate-950">
                      {t(`tiers.${tier.key}.name`)}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-6 min-h-[2.5rem]">
                    {t(`tiers.${tier.key}.tagline`)}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {tier.originalPrice && (
                      <div className="text-sm text-slate-400 line-through">
                        ฿{formatTHB(tier.originalPrice)}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">
                        {tier.promoPrice === 0 ? (locale === "th" ? "฿0" : "฿0") : `฿${formatTHB(tier.promoPrice)}`}
                      </span>
                      <span className="text-sm font-medium text-slate-600">
                        {tier.suffix[locale as "th" | "en"]}
                      </span>
                    </div>
                    {tier.originalPrice && (
                      <div className="text-xs text-rose-600 font-bold mt-1">
                        🎉 {locale === "th" ? "ลด 50% ราคาเปิดตัว" : "50% OFF Launch Promo"}
                      </div>
                    )}
                    {/* Yearly bonus banner */}
                    {tier.key === "yearly" && (
                      <div className="mt-2 px-2 py-1.5 rounded-md bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 text-xs font-bold text-emerald-800">
                        🎁 {locale === "th" ? "ฟรี! เพิ่มอีก 3 เดือน รวมใช้ได้ 15 เดือน" : "BONUS! +3 months free — 15 months total"}
                      </div>
                    )}
                  </div>

                  {/* Quick info */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span><strong>{tier.filesPerDay[locale as "th" | "en"]}</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{t("diff.desktop")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {tier.offline ? <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" /> : <X size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />}
                      <span>{t("diff.offline")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{t(`diff.${tier.duration}`)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}${tier.href}`}
                    className={`block w-full text-center px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 ${tier.button}`}
                  >
                    {t(`tiers.${tier.key}.cta`)}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features section: split into "all plans" + "paid only" */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {t("features.title")}
            </h2>
          </div>

          {/* Group 1: Available in every plan (incl. Free) */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-bold text-emerald-700">
                ✓ {locale === "th" ? "ทุกแพ็กเกจ" : "All Plans"}
              </div>
              <h3 className="text-lg font-bold text-slate-700">{t("features.subtitleAll")}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {FEATURES_ALL.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl"
                >
                  <Check size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-800">{t(`features.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Paid plans only */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1 bg-purple-100 border border-purple-300 rounded-full text-xs font-bold text-purple-700">
                💎 {locale === "th" ? "แพ็กเกจจ่ายเงิน" : "Paid Only"}
              </div>
              <h3 className="text-lg font-bold text-slate-700">{t("features.subtitlePaid")}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {FEATURES_PAID.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-xl"
                >
                  <Crown size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-800">{t(`features.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center text-slate-900 mb-10">
            {t("diff.title")}
          </h2>
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold"></th>
                  {TIERS.map((tier) => (
                    <th key={tier.key} className="px-4 py-4 text-center text-sm font-bold">
                      {t(`tiers.${tier.key}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Section divider: Plan info */}
                <tr className="bg-blue-100">
                  <td colSpan={5} className="px-4 py-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                    📦 {locale === "th" ? "ข้อมูลแพ็กเกจ" : "Plan Details"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{t("diff.filesPerDay")}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="px-4 py-3 text-sm text-center font-bold text-slate-900">
                      {tier.filesPerDay[locale as "th" | "en"]}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{t("diff.desktop")}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="px-4 py-3 text-center">
                      {tier.desktop ? <Check size={20} className="inline text-emerald-600" /> : <X size={20} className="inline text-slate-300" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{t("diff.offline")}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="px-4 py-3 text-center">
                      {tier.offline ? <Check size={20} className="inline text-emerald-600" /> : <X size={20} className="inline text-slate-300" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{t("diff.duration")}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="px-4 py-3 text-sm text-center font-bold text-slate-900">
                      {tier.duration === "days365" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-400 text-emerald-800 text-xs font-extrabold shadow-sm whitespace-nowrap animate-pulse">
                          🎁 {t(`diff.${tier.duration}`)}
                        </span>
                      ) : (
                        t(`diff.${tier.duration}`)
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{t("diff.license")}</td>
                  {TIERS.map((tier) => (
                    <td key={tier.key} className="px-4 py-3 text-center">
                      {tier.license ? <Check size={20} className="inline text-emerald-600" /> : <X size={20} className="inline text-slate-300" />}
                    </td>
                  ))}
                </tr>
                {/* Section divider: Paid-only features */}
                <tr className="bg-purple-100">
                  <td colSpan={5} className="px-4 py-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                    💎 {locale === "th" ? "ฟีเจอร์ AI ขั้นสูง (เฉพาะแพ็กเกจจ่ายเงิน)" : "Advanced AI Features (Paid Plans Only)"}
                  </td>
                </tr>
                {FEATURES_PAID.map((key) => (
                  <tr key={key} className="bg-purple-50/40">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{t(`features.${key}`)}</td>
                    {TIERS.map((tier) => (
                      <td key={tier.key} className="px-4 py-3 text-center">
                        {tier.key === "free" ? <X size={20} className="inline text-slate-300" /> : <Check size={20} className="inline text-emerald-600" />}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Section divider: All-plan features */}
                <tr className="bg-emerald-100">
                  <td colSpan={5} className="px-4 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    ✓ {locale === "th" ? "ฟีเจอร์พื้นฐาน (ทุกแพ็กเกจ)" : "Core Features (All Plans)"}
                  </td>
                </tr>
                {FEATURES_ALL.map((key) => (
                  <tr key={key} className="bg-emerald-50/40">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{t(`features.${key}`)}</td>
                    {TIERS.map((tier) => (
                      <td key={tier.key} className="px-4 py-3 text-center">
                        <Check size={20} className="inline text-emerald-600" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
