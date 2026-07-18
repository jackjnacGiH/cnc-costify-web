import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UpgradeForm } from "@/components/UpgradeForm";
import { Crown, Star, Gem, Check } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string }>;
};

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function fetchMe(cookie: string) {
  try {
    const r = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.ok ? data.user : null;
  } catch {
    return null;
  }
}

const PLANS = {
  monthly: {
    icon: Star, color: "blue",
    name: { th: "Monthly", en: "Monthly" },
    price: 445, suffix: { th: "/เดือน", en: "/mo" },
    validity: { th: "30 วัน", en: "30 days" },
    perks: {
      th: ["30 ไฟล์/วัน", "ฟีเจอร์ AI ครบ", "ใช้งานต้องเชื่อมต่ออินเทอร์เน็ต"],
      en: ["30 files/day", "All AI features", "Internet connection required"],
    },
  },
  yearly: {
    icon: Gem, color: "purple",
    name: { th: "Yearly", en: "Yearly" },
    price: 4450, suffix: { th: "/ปี", en: "/yr" },
    validity: { th: "12 + ฟรี 3 เดือน (รวม 15 เดือน)", en: "12 + 3 free = 15 months" },
    perks: {
      th: ["ไฟล์ไม่จำกัด", "License Key สำหรับใช้งานออฟไลน์", "🎁 จ่าย 1 ปี แถมฟรี 3 เดือน"],
      en: ["Unlimited files", "Offline License Key", "🎁 Pay 1 year, get 3 months free"],
    },
  },
  lifetime: {
    icon: Crown, color: "amber",
    name: { th: "Lifetime", en: "Lifetime" },
    price: 26700, suffix: { th: "ครั้งเดียว", en: "once" },
    validity: { th: "ตลอดชีพ", en: "Forever" },
    perks: {
      th: ["ไฟล์ไม่จำกัด ตลอดชีพ", "License Key (.dat) ออฟไลน์", "🔥 ลด 70% ราคาเปิดตัว"],
      en: ["Unlimited forever", "Offline License Key (.dat)", "🔥 70% OFF Launch Promo"],
    },
  },
} as const;

export default async function UpgradePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { plan: planParam } = await searchParams;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/upgrade${planParam ? `?plan=${planParam}` : ""}`)}`);
  }

  const planKey = (planParam && (planParam in PLANS)) ? planParam as keyof typeof PLANS : null;

  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-slate-50 py-12 min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              {locale === "th" ? "อัปเกรดแพ็กเกจ" : "Upgrade Your Plan"}
            </h1>
            <p className="text-slate-600">
              {locale === "th"
                ? "เลือกแพ็กเกจ → โอน PromptPay → อัปโหลดสลิป → admin ยืนยันใน 24 ชม."
                : "Pick a plan → pay via PromptPay → upload slip → admin confirms within 24 h"}
            </p>
          </div>

          {!planKey ? (
            // Plan picker
            <PlanPicker locale={locale} />
          ) : (
            // Order form for selected plan
            <Suspense fallback={<div className="h-96 bg-white/40 rounded-2xl animate-pulse" />}>
              <OrderSection locale={locale} planKey={planKey} userEmail={user.email} />
            </Suspense>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

function PlanPicker({ locale }: { locale: string }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
        const p = PLANS[key];
        const Icon = p.icon;
        return (
          <Link
            key={key}
            href={`/${locale}/upgrade?plan=${key}`}
            className={`group bg-white rounded-2xl border-2 border-${p.color}-200 hover:border-${p.color}-500 p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all`}
          >
            <Icon size={32} className={`text-${p.color}-600 mb-3`} />
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {p.name[locale as "th" | "en"]}
            </h2>
            <div className="text-3xl font-black gradient-text mb-3">
              ฿{p.price.toLocaleString()}<span className="text-sm font-medium text-slate-600">{p.suffix[locale as "th" | "en"]}</span>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 mb-4">
              {p.perks[locale as "th" | "en"].map((perk, i) => (
                <li key={i} className="flex items-start gap-1.5"><Check size={14} className={`text-${p.color}-600 mt-0.5 flex-shrink-0`} />{perk}</li>
              ))}
            </ul>
            <div className={`mt-auto pt-3 text-center text-sm font-bold text-${p.color}-700`}>
              {locale === "th" ? "เลือกแพ็กเกจนี้ →" : "Choose this plan →"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function OrderSection({ locale, planKey, userEmail }: {
  locale: string;
  planKey: keyof typeof PLANS;
  userEmail: string;
}) {
  const p = PLANS[planKey];
  const Icon = p.icon;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: order summary + bank/QR */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon size={28} className={`text-${p.color}-600`} />
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold">
                {locale === "th" ? "แพ็กเกจที่เลือก" : "Selected plan"}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{p.name[locale as "th" | "en"]}</h2>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-slate-600">{locale === "th" ? "ยอดที่ต้องชำระ" : "Amount to pay"}</span>
              <span className="text-3xl font-black text-slate-900">฿{p.price.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-500">
              {locale === "th" ? "ใช้งาน:" : "Validity:"} <strong>{p.validity[locale as "th" | "en"]}</strong>
            </div>
          </div>
          <Link
            href={`/${locale}/upgrade`}
            className="mt-4 block text-xs text-slate-500 hover:text-blue-600 hover:underline"
          >
            ← {locale === "th" ? "เลือกแพ็กเกจอื่น" : "Choose a different plan"}
          </Link>
        </div>

        {/* PromptPay / Bank info */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="font-black text-slate-900 mb-3">
            💸 {locale === "th" ? "ช่องทางชำระเงิน" : "Payment options"}
          </h3>

          {/* QR — plan-specific (preloaded with the right amount) */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-3 text-center">
            <div className="text-xs font-bold text-slate-700 mb-2">
              📱 PromptPay QR · {locale === "th" ? "ยอด ฿" : "Amount ฿"}{p.price.toLocaleString()}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/qr/promptpay-${planKey}.png`}
              alt={`PromptPay QR Code — ${planKey} — ฿${p.price}`}
              className="mx-auto w-64 max-w-full object-contain bg-white rounded-lg p-2 shadow"
            />
            <div className="text-xs text-slate-600 mt-2">
              {locale === "th" ? "บริษัท เจ แนค (ประเทศไทย) จำกัด" : "J Nac (Thailand) Co., Ltd."}
            </div>
            <div className="text-base font-black text-rose-600 mt-1">฿{p.price.toLocaleString()}</div>
            <p className="text-[10px] text-slate-500 mt-1">
              {locale === "th"
                ? "💡 สแกน QR แล้วยอดจะใส่ให้อัตโนมัติ ไม่ต้องกรอกเอง"
                : "💡 Scan and the amount auto-fills"}
            </p>
          </div>

          {/* Bank */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
            <div className="font-bold text-slate-900 mb-2">
              🏦 {locale === "th" ? "หรือโอนผ่านธนาคาร" : "Or bank transfer"}
            </div>
            <div className="space-y-1 text-slate-700">
              <div>{locale === "th" ? "ธนาคาร" : "Bank"}: <strong>กสิกรไทย / KBank</strong></div>
              <div>{locale === "th" ? "สาขา" : "Branch"}: โรบินสัน สมุทรปราการ</div>
              <div>{locale === "th" ? "ชื่อบัญชี" : "Account name"}: <strong>บริษัท เจ แนค (ประเทศไทย) จำกัด</strong></div>
              <div>{locale === "th" ? "เลขบัญชี" : "Account #"}:
                <span className="ml-2 font-mono font-black text-base text-slate-900 bg-amber-100 px-2 py-0.5 rounded">041-3-21617-6</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{locale === "th" ? "(ออมทรัพย์)" : "(Savings)"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: slip upload form */}
      <div>
        <UpgradeForm
          locale={locale}
          plan={planKey}
          amount={p.price}
          userEmail={userEmail}
        />
      </div>
    </div>
  );
}
