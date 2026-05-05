import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Sparkles, ArrowRight, FileBox, ScanLine, Calculator, FileSpreadsheet,
  Brain, MessageSquare, Zap, Shield, CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomePageContent locale={locale} />;
}

function HomePageContent({ locale }: { locale: string }) {
  const t = useTranslations("Hero");
  const tFeat = useTranslations("Features");
  const tPricing = useTranslations("Pricing");

  const features = [
    { key: "step",    icon: FileBox,         color: "from-blue-500 to-cyan-500" },
    { key: "pdfjpg",  icon: ScanLine,        color: "from-purple-500 to-pink-500" },
    { key: "calc",    icon: Calculator,      color: "from-emerald-500 to-teal-500" },
    { key: "excel",   icon: FileSpreadsheet, color: "from-amber-500 to-orange-500" },
    { key: "ai",      icon: Brain,           color: "from-indigo-500 to-blue-500" },
    { key: "chat",    icon: MessageSquare,   color: "from-rose-500 to-red-500" },
  ] as const;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-slate-50 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute inset-0 bg-grid-slate opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-transparent blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full text-sm font-bold text-blue-800 mb-8 animate-fade-in-up">
            <Sparkles size={16} className="text-purple-600" />
            {t("badge")}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 animate-fade-in-up">
            {t("headline")}
            <br />
            <span className="gradient-text">{t("headlineHighlight")}</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 animate-fade-in-up">
            {t("subheadline")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up">
            <Link
              href={`/${locale}/signup`}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 glow-blue"
            >
              {t("ctaPrimary")}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 text-lg font-bold rounded-xl border-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
            {[
              { value: "100+", label: t("stats.materials") },
              { value: t("stats.speedValue"), label: t("stats.speed") },
              { value: "13", label: locale === "th" ? "ฟีเจอร์ AI" : "AI Features" },
            ].map((s, i) => (
              <div key={i} className="bg-white/70 backdrop-blur border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
                <div className="text-3xl md:text-4xl font-black gradient-text">{s.value}</div>
                <div className="text-xs md:text-sm text-slate-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              {tFeat("title")}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {tFeat("subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                className="group bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all"
              >
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {tFeat(`items.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tFeat(`items.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 border border-rose-200 rounded-full text-sm font-bold text-rose-700 mb-6">
            <Zap size={16} />
            {tPricing("promoBadge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {tPricing("title")}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            {tPricing("subtitle")}
          </p>
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all"
          >
            {locale === "th" ? "ดูแพ็กเกจทั้งหมด" : "View All Plans"}
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="inline-flex w-14 h-14 rounded-full bg-blue-100 items-center justify-center mb-4">
                <Shield size={26} className="text-blue-600" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-2">
                {locale === "th" ? "ปลอดภัย เชื่อถือได้" : "Safe & Trusted"}
              </h3>
              <p className="text-sm text-slate-600">
                {locale === "th" ? "ข้อมูลของคุณเก็บบนเซิร์ฟเวอร์ที่ปลอดภัย รหัสผ่านเข้ารหัส และมีระบบ License Key" : "Your data on secure servers, encrypted passwords, license-key protected"}
              </p>
            </div>
            <div>
              <div className="inline-flex w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <CheckCircle2 size={26} className="text-emerald-600" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-2">
                {locale === "th" ? "อัปเกรดฟรีตลอดชีพ" : "Free Lifetime Upgrades"}
              </h3>
              <p className="text-sm text-slate-600">
                {locale === "th" ? "ทุกแพ็กเกจได้รับการอัปเดตเวอร์ชั่นใหม่ฟรี ไม่มีค่าใช้จ่ายเพิ่ม" : "Every plan gets free version upgrades — no extra charges"}
              </p>
            </div>
            <div>
              <div className="inline-flex w-14 h-14 rounded-full bg-purple-100 items-center justify-center mb-4">
                <Brain size={26} className="text-purple-600" />
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-2">
                {locale === "th" ? "AI ทำงานทุกที่" : "AI Everywhere"}
              </h3>
              <p className="text-sm text-slate-600">
                {locale === "th" ? "Gemini + OpenRouter (Qwen, GLM, Claude, Llama) สลับใช้อัตโนมัติเมื่อ quota เต็ม" : "Gemini + OpenRouter (Qwen, GLM, Claude, Llama) auto-fallback"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
