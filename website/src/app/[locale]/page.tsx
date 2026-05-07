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
            CNC Costify AI V5.1
          </div>
        </div>
        {/* Image (with fallback gradient if not present) */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={imgAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className={`text-xs font-bold tracking-widest uppercase mb-2 px-2 py-0.5 rounded ${a.badge} border opacity-80`}>
              {badge}
            </div>
            <div className="text-slate-400 text-sm">
              Screenshot will load when /public/screenshots/* is populated
            </div>
          </div>
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
