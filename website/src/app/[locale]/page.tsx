import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Sparkles, ArrowRight, FileBox, ScanLine, Calculator, FileSpreadsheet,
  Brain, MessageSquare, Zap, Shield, CheckCircle2,
  Clock, Phone, AlertTriangle, Moon, Lock, TrendingDown,
  Rocket, Check, Database, Globe, BatteryCharging, Trophy,
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
  const tPain = useTranslations("Pain");
  const tBene = useTranslations("Benefit");
  const tPrev = useTranslations("Preview");

  const features = [
    { key: "step",    icon: FileBox,         color: "from-blue-500 to-cyan-500" },
    { key: "pdfjpg",  icon: ScanLine,        color: "from-purple-500 to-pink-500" },
    { key: "calc",    icon: Calculator,      color: "from-emerald-500 to-teal-500" },
    { key: "excel",   icon: FileSpreadsheet, color: "from-amber-500 to-orange-500" },
    { key: "ai",      icon: Brain,           color: "from-indigo-500 to-blue-500" },
    { key: "chat",    icon: MessageSquare,   color: "from-rose-500 to-red-500" },
  ] as const;

  const painItems = [
    { key: "slow",       icon: Clock },
    { key: "nostandard", icon: AlertTriangle },
    { key: "supplier",   icon: Phone },
    { key: "latenight",  icon: Moon },
    { key: "office",     icon: Lock },
    { key: "lostdeal",   icon: TrendingDown },
  ] as const;

  const benefitItems = [
    { key: "fast",     icon: Rocket,           color: "from-blue-500 to-cyan-500" },
    { key: "standard", icon: Check,            color: "from-emerald-500 to-teal-500" },
    { key: "noCall",   icon: Database,         color: "from-purple-500 to-pink-500" },
    { key: "always",   icon: Globe,            color: "from-indigo-500 to-blue-500" },
    { key: "moreTime", icon: BatteryCharging,  color: "from-amber-500 to-orange-500" },
    { key: "winMore",  icon: Trophy,           color: "from-rose-500 to-red-500" },
  ] as const;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="site-hero py-14 md:py-20">
        <div className="site-hero-orb" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="text-center lg:text-left">
              <div className="site-eyebrow mb-6 animate-fade-in-up">
                <Sparkles size={16} className="text-violet-500" />
                {t("badge")}
              </div>

              <h1 className={`site-hero-title mb-6 text-4xl md:text-6xl lg:text-7xl animate-fade-in-up ${locale === "th" ? "font-bold leading-[1.22] tracking-normal" : "font-black leading-[1.05] tracking-tight"}`}>
                {t("headline")}
                <span className={`block ${locale === "th" ? "mt-0 pb-2 pt-1 text-blue-600" : "site-hero-highlight mt-2"}`}>
                  {t("headlineHighlight")}
                </span>
              </h1>

              <p className="site-hero-copy mx-auto mb-8 max-w-2xl text-base leading-relaxed md:text-xl lg:mx-0 animate-fade-in-up">
                {t("subheadline")}
              </p>

              <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start animate-fade-in-up">
                <Link
                  href={`/${locale}/signup`}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-7 py-4 text-lg font-black text-white shadow-2xl shadow-blue-500/30 transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  {t("ctaPrimary")}
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`/${locale}/download`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-4 text-lg font-bold text-slate-800 shadow-sm transition hover:border-blue-400 hover:text-blue-700 hover:shadow-md"
                >
                  {locale === "th" ? "ดาวน์โหลด V5.14" : "Download V5.14"}
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600 lg:justify-start">
                {[locale === "th" ? "ทดลองใช้ฟรี 3 ไฟล์/วัน" : "3 free files/day", locale === "th" ? "ไม่ผูกบัตรเครดิต" : "No credit card", "Windows 10 / 11"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-blue-400/20 to-violet-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">CNC Costify AI · LIVE QUOTE</span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black text-emerald-300">
                    {locale === "th" ? "พร้อมใช้งาน" : "READY"}
                  </span>
                </div>

                <div className="grid md:grid-cols-[0.9fr_1.1fr]">
                  <div className="border-b border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent p-5 md:border-b-0 md:border-r">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-300">STEP MODEL</span>
                      <span className="rounded-md bg-blue-400/15 px-2 py-1 text-[10px] text-blue-200">A6061</span>
                    </div>
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-blue-300/15 bg-slate-950/50">
                      <div className="absolute inset-0 bg-grid-slate opacity-30" />
                      <div className="relative h-28 w-40 -skew-y-6 rounded-lg border border-cyan-300/70 bg-gradient-to-br from-blue-400/35 to-violet-500/10 shadow-[0_0_45px_rgba(56,189,248,0.25)]">
                        <div className="absolute left-5 top-5 h-9 w-9 rounded-full border-2 border-cyan-200/70 bg-slate-950/70" />
                        <div className="absolute bottom-4 right-5 h-5 w-16 rounded border border-violet-300/60" />
                      </div>
                    </div>
                    <p className="mt-3 truncate text-xs font-bold text-slate-300">AL_Base_1.step</p>
                    <p className="mt-1 text-[11px] text-slate-500">300 × 920 × 25 mm · 18.63 kg</p>
                  </div>

                  <div className="p-5 text-left">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-fuchsia-300">
                        {locale === "th" ? "ผลคำนวณอัตโนมัติ" : "AUTO COST RESULT"}
                      </span>
                      <Zap size={17} className="text-amber-300" aria-hidden="true" />
                    </div>
                    <div className="space-y-2.5 text-sm">
                      {[
                        [locale === "th" ? "ค่าวัสดุ" : "Material", "฿4,660"],
                        [locale === "th" ? "งานชุบผิว" : "Coating", "฿3,330"],
                        [locale === "th" ? "กระบวนการ CNC" : "CNC process", "฿7,600"],
                        [locale === "th" ? "ค่า Setup" : "Setup", "฿350"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <span className="text-slate-400">{label}</span>
                          <span className="font-bold text-slate-200">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <p className="text-xs font-bold text-emerald-300">{locale === "th" ? "ราคาต่อชิ้น" : "PRICE / PART"}</p>
                      <p className="mt-1 text-3xl font-black text-white">฿16,725</p>
                      <p className="mt-1 text-xs text-emerald-200/70">10 pcs · Total ฿167,250</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 shadow-xl">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {locale === "th" ? "จากไฟล์สู่ราคาพร้อมเสนอในไม่กี่วินาที" : "From file to quote-ready cost in seconds"}
              </div>
            </div>
          </div>

          <div className="site-surface mx-auto mt-16 max-w-5xl rounded-2xl p-3 backdrop-blur-xl md:p-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { icon: FileBox, th: "ใส่ไฟล์ STEP / PDF", en: "Drop STEP / PDF" },
                { icon: Brain, th: "AI อ่านแบบ", en: "AI reads drawing" },
                { icon: Calculator, th: "คำนวณต้นทุน", en: "Calculate cost" },
                { icon: FileSpreadsheet, th: "ส่งออกใบเสนอราคา", en: "Export quote" },
              ].map(({ icon: Icon, th, en }, index) => (
                <div
                  key={en}
                  className="relative flex min-h-20 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {locale === "th" ? `ขั้นที่ ${index + 1}` : `Step ${index + 1}`}
                    </span>
                    <span className="block text-sm font-black leading-tight text-slate-800">
                      {locale === "th" ? th : en}
                    </span>
                  </span>
                  {index < 3 && (
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-blue-600 p-0.5 text-white md:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-5 grid max-w-3xl grid-cols-3 gap-3 md:gap-5">
            {[
              { value: "100+", label: t("stats.materials") },
              { value: t("stats.speedValue"), label: t("stats.speed") },
              { value: "13", label: locale === "th" ? "ฟีเจอร์ AI" : "AI Features" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white/80 p-3 text-center shadow-sm backdrop-blur md:p-4">
                <div className="site-hero-highlight text-2xl font-black md:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-slate-500 md:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pain points ─── */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-rose-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 border border-rose-200 rounded-full text-sm font-bold text-rose-700 mb-4">
              <AlertTriangle size={16} />
              {locale === "th" ? "ปัญหาที่เราแก้" : "Problems we solve"}
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              {tPain("title")}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{tPain("subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {painItems.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group bg-white border-l-4 border-rose-400 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 mb-1.5 leading-snug">
                      {tPain(`items.${key}.title`)}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {tPain(`items.${key}.desc`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── App Spotlight — 4 alternating left/right rows ─── */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              {tPrev("title")}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{tPrev("subtitle")}</p>
          </div>

          <div className="space-y-20 md:space-y-28">
            <SpotlightRow
              imgSrc="/screenshots/main-step.png"
              imgAlt="CNC Costify AI — Main / STEP volume calculator"
              imgSide="left"
              accent="blue"
              badge={tPrev("spot1.badge")}
              title={tPrev("spot1.title")}
              desc={tPrev("spot1.desc")}
              bullets={[tPrev("spot1.b1"), tPrev("spot1.b2"), tPrev("spot1.b3")]}
            />
            <SpotlightRow
              imgSrc="/screenshots/pdf-batch.png"
              imgAlt="CNC Costify AI — PDF/JPG batch AI analysis"
              imgSide="right"
              accent="purple"
              badge={tPrev("spot2.badge")}
              title={tPrev("spot2.title")}
              desc={tPrev("spot2.desc")}
              bullets={[tPrev("spot2.b1"), tPrev("spot2.b2"), tPrev("spot2.b3")]}
            />
            <SpotlightRow
              imgSrc="/screenshots/settings.png"
              imgAlt="CNC Costify AI — Settings / pricing customization"
              imgSide="left"
              accent="amber"
              badge={tPrev("spot3.badge")}
              title={tPrev("spot3.title")}
              desc={tPrev("spot3.desc")}
              bullets={[tPrev("spot3.b1"), tPrev("spot3.b2"), tPrev("spot3.b3")]}
            />
            <SpotlightRow
              imgSrc="/screenshots/ai-chat.png"
              imgAlt="CNC Costify AI — AI material consultation chat"
              imgSide="right"
              accent="emerald"
              badge={tPrev("spot4.badge")}
              title={tPrev("spot4.title")}
              desc={tPrev("spot4.desc")}
              bullets={[tPrev("spot4.b1"), tPrev("spot4.b2"), tPrev("spot4.b3")]}
            />
            <SpotlightRow
              imgSrc="/screenshots/excel-export.png"
              imgAlt="CNC Costify AI — Excel export with multi-sheet quotes"
              imgSide="left"
              accent="blue"
              badge={tPrev("spot5.badge")}
              title={tPrev("spot5.title")}
              desc={tPrev("spot5.desc")}
              bullets={[tPrev("spot5.b1"), tPrev("spot5.b2"), tPrev("spot5.b3")]}
            />
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-20 bg-gradient-to-b from-emerald-50/40 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-sm font-bold text-emerald-700 mb-4">
              <CheckCircle2 size={16} />
              {locale === "th" ? "ผลลัพธ์ที่จะได้" : "What you get"}
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              {tBene("title")}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{tBene("subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitItems.map(({ key, icon: Icon, color }) => (
              <div
                key={key}
                className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:border-emerald-300 hover:-translate-y-1 transition-all"
              >
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white items-center justify-center shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-snug">
                  {tBene(`items.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tBene(`items.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
            >
              {locale === "th" ? "เริ่มทดลองฟรีตอนนี้" : "Start Free Trial Now"}
              <ArrowRight size={20} />
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              {locale === "th" ? "ไม่ต้องผูกบัตรเครดิต · ติดตั้งใน 2 นาที" : "No credit card required · 2-minute install"}
            </p>
          </div>
        </div>
      </section>

      {/* Features (existing) */}
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

/**
 * Spotlight row — large screenshot on one side, marketing copy on the other.
 * Mobile: stacks vertically (image always on top of text on small screens).
 *
 * The screenshot is wrapped in a stylish browser-mockup frame with a soft
 * glow/blur in the accent color. If the real PNG hasn't been added yet, a
 * polished gradient fallback is shown so the layout never looks broken.
 */
function SpotlightRow({
  imgSrc, imgAlt, imgSide, accent, badge, title, desc, bullets,
}: {
  imgSrc: string;
  imgAlt: string;
  imgSide: "left" | "right";
  accent: "blue" | "purple" | "amber" | "emerald";
  badge: string;
  title: string;
  desc: string;
  bullets: string[];
}) {
  const accentMap = {
    blue:    { glow: "from-blue-400/30 to-cyan-300/20",    badge: "bg-blue-100 text-blue-700 border-blue-300",    border: "ring-blue-500/30",    bullet: "text-blue-600" },
    purple:  { glow: "from-purple-400/30 to-pink-300/20",  badge: "bg-purple-100 text-purple-700 border-purple-300", border: "ring-purple-500/30", bullet: "text-purple-600" },
    amber:   { glow: "from-amber-400/30 to-orange-300/20", badge: "bg-amber-100 text-amber-800 border-amber-300", border: "ring-amber-500/30",   bullet: "text-amber-600" },
    emerald: { glow: "from-emerald-400/30 to-teal-300/20", badge: "bg-emerald-100 text-emerald-700 border-emerald-300", border: "ring-emerald-500/30", bullet: "text-emerald-600" },
  };
  const a = accentMap[accent];

  const ImageBlock = (
    <div className="relative">
      {/* Soft glow behind the screenshot */}
      <div className={`absolute -inset-6 bg-gradient-to-br ${a.glow} rounded-3xl blur-3xl -z-10`} />
      {/* Browser mock + screenshot */}
      <div className={`relative bg-slate-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ${a.border} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500`}>
        {/* Mock title bar */}
        <div className="bg-slate-700/80 px-3 py-2 flex items-center gap-2 border-b border-slate-600/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 text-center text-[10px] text-slate-400 font-mono tracking-tight truncate">
            CNC Costify AI V5.14
          </div>
        </div>
        {/*
         * Background-image with placeholder underneath. If the PNG is missing
         * the image silently fails to load (no broken-image icon since we
         * use background-image, not <img>) and the placeholder shows through.
         * No client-side onError handler needed — server component safe.
         */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Placeholder layer */}
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
            <div className={`text-xs font-bold tracking-widest uppercase mb-2 px-2 py-0.5 rounded ${a.badge} border opacity-80`}>
              {badge}
            </div>
            <div className="text-slate-400 text-sm">
              CNC Costify AI V5.14
            </div>
          </div>
          {/* Image layer (covers placeholder when present) */}
          <div
            className="absolute inset-0 bg-cover bg-top bg-no-repeat"
            style={{ backgroundImage: `url(${imgSrc})` }}
            role="img"
            aria-label={imgAlt}
          />
        </div>
      </div>
    </div>
  );

  const TextBlock = (
    <div>
      <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-extrabold tracking-widest mb-4 ${a.badge}`}>
        {badge}
      </div>
      <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
        {title}
      </h3>
      <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6">
        {desc}
      </p>
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm md:text-base text-slate-700`}>
            <span className={`font-black text-lg ${a.bullet} leading-none`}>{b.startsWith("✓") ? "" : "✓"}</span>
            <span>{b.replace(/^✓\s*/, "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      {imgSide === "left" ? (
        <>
          <div className="order-2 md:order-1">{ImageBlock}</div>
          <div className="order-1 md:order-2">{TextBlock}</div>
        </>
      ) : (
        <>
          <div className="order-2 md:order-1">{TextBlock}</div>
          <div className="order-1 md:order-2">{ImageBlock}</div>
        </>
      )}
    </div>
  );
}
