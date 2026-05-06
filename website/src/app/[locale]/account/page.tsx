import { setRequestLocale } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LogoutButton } from "@/components/LogoutButton";
import { ResendVerifyButton } from "@/components/ResendVerifyButton";
import { AccountUsageCard } from "@/components/AccountUsageCard";
import { AccountDevicesCard } from "@/components/AccountDevicesCard";
import { LaunchDesktopButton } from "@/components/LaunchDesktopButton";
import { AccountPlanCard } from "@/components/AccountPlanCard";
import { Calendar, ArrowUp, Mail, User, Building2, Phone } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

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

function formatDate(ms: number | null, locale: string): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  }).format(new Date(ms));
}

const PLAN_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  free:     { bg: "bg-slate-100", text: "text-slate-700", icon: "🆓" },
  monthly:  { bg: "bg-blue-100",  text: "text-blue-700",  icon: "⭐" },
  yearly:   { bg: "bg-purple-100",text: "text-purple-700",icon: "💎" },
  lifetime: { bg: "bg-amber-100", text: "text-amber-700", icon: "👑" },
};

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";

  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const planStyle = PLAN_COLORS[user.plan] || PLAN_COLORS.free;
  const isLifetime = user.plan === "lifetime";

  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-slate-50 py-12 min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
              {locale === "th" ? "บัญชีของฉัน" : "My Account"}
            </h1>
            <LogoutButton locale={locale} />
          </div>

          {/* Email verification banner — only if not verified */}
          {!user.verified && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-4">
              <Mail size={28} className="text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-black text-amber-900 mb-1">
                  {locale === "th" ? "กรุณายืนยันอีเมลของคุณ" : "Please verify your email"}
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  {locale === "th"
                    ? `เราได้ส่งลิงก์ยืนยันไปที่ ${user.email} แล้ว — กรุณาตรวจสอบ inbox (และ spam folder)`
                    : `We sent a verification link to ${user.email} — please check your inbox (and spam folder)`}
                </p>
                <ResendVerifyButton locale={locale} />
              </div>
            </div>
          )}

          {/* Launch Desktop button */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-black text-slate-900 mb-1">
                  {locale === "th" ? "🚀 เริ่มใช้งานเลย" : "🚀 Get Started"}
                </h3>
                <p className="text-sm text-slate-600">
                  {locale === "th"
                    ? "เปิด CNC Costify AI Desktop ที่ติดตั้งบนเครื่องของคุณ"
                    : "Launch CNC Costify AI Desktop installed on your machine"}
                </p>
              </div>
              <LaunchDesktopButton locale={locale} />
            </div>
          </div>

          {/* Plan card — overrides FREE display when license.dat is reported by Desktop */}
          <AccountPlanCard
            locale={locale}
            plan={user.plan}
            planExpiresAt={user.plan_expires_at || null}
          />

          {/* Today's usage */}
          <AccountUsageCard locale={locale} />

          {/* Connected devices */}
          <AccountDevicesCard locale={locale} />

          {/* Profile info */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {locale === "th" ? "ข้อมูลส่วนตัว" : "Profile"}
            </h2>
            <div className="space-y-3">
              <Field icon={Mail} label={locale === "th" ? "อีเมล" : "Email"} value={user.email}
                badge={user.verified ? { text: locale === "th" ? "ยืนยันแล้ว" : "Verified", color: "emerald" }
                                       : { text: locale === "th" ? "ยังไม่ได้ยืนยัน" : "Not verified", color: "amber" }} />
              <Field icon={User} label={locale === "th" ? "ชื่อ" : "Name"} value={user.name || "—"} />
              <Field icon={Building2} label={locale === "th" ? "บริษัท" : "Company"} value={user.company || "—"} />
              <Field icon={Phone} label={locale === "th" ? "เบอร์โทร" : "Phone"} value={user.phone || "—"} />
            </div>
          </div>

          {/* Account meta */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {locale === "th" ? "ข้อมูลบัญชี" : "Account Info"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                  {locale === "th" ? "สมาชิกตั้งแต่" : "Member since"}
                </div>
                <div className="text-slate-900">{formatDate(user.created_at, locale)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">
                  {locale === "th" ? "เข้าสู่ระบบล่าสุด" : "Last login"}
                </div>
                <div className="text-slate-900">{formatDate(user.last_login_at, locale)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function Field({ icon: Icon, label, value, badge }: {
  icon: React.ElementType; label: string; value: string;
  badge?: { text: string; color: "emerald" | "amber" };
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900 flex items-center gap-2 flex-wrap">
          <span>{value}</span>
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-${badge.color}-100 text-${badge.color}-700`}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
