import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminTabs } from "@/components/AdminTabs";
import { LicenseGeneratorForm } from "@/components/LicenseGeneratorForm";
import { ShieldAlert } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ user_id?: string; user_email?: string }>;
};

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").toLowerCase()
  .split(",").map((s) => s.trim()).filter(Boolean);

async function fetchMe(cookie: string) {
  try {
    const r = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Cookie: cookie }, cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.ok ? data.user : null;
  } catch { return null; }
}

export default async function AdminLicensePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { user_id, user_email } = await searchParams;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin/license`)}`);
  }
  const isAdmin = ADMIN_EMAILS.includes(String(user.email).toLowerCase());

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <section className="bg-rose-50 py-16 min-h-[80vh]">
          <div className="max-w-md mx-auto px-4 text-center">
            <ShieldAlert size={64} className="mx-auto text-rose-600 mb-4" />
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {locale === "th" ? "ไม่มีสิทธิ์เข้าถึง" : "Access denied"}
            </h1>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="bg-slate-50 py-8 min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3">
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              🛡️ {locale === "th" ? "Admin Panel" : "Admin Panel"}
            </h1>
            <p className="text-sm text-slate-600">
              {locale === "th"
                ? "ออก License Key จาก Hardware ID — ต่ออายุก่อนหมดจะบวกเพิ่มจากวันที่เหลือ"
                : "Generate license key from Hardware ID — early renewal extends remaining days."}
            </p>
          </div>
          <AdminTabs locale={locale} />
          <Suspense fallback={<div className="h-96 bg-white rounded-2xl animate-pulse" />}>
            <LicenseGeneratorForm
              locale={locale}
              presetUserId={user_id ? parseInt(user_id, 10) : null}
              presetUserEmail={user_email || null}
            />
          </Suspense>
        </div>
      </section>
      <Footer />
    </>
  );
}
