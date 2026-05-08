import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminOrdersClient } from "@/components/AdminOrdersClient";
import { ShieldAlert } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").toLowerCase()
  .split(",").map((s) => s.trim()).filter(Boolean);

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

export default async function AdminOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin/orders`)}`);
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
            <p className="text-slate-600">
              {locale === "th" ? "หน้านี้สำหรับ Admin เท่านั้น" : "This page is for admins only."}
            </p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              🛡️ {locale === "th" ? "Admin: คำสั่งซื้อ" : "Admin: Orders"}
            </h1>
            <p className="text-sm text-slate-600">
              {locale === "th" ? "ตรวจสลิปและยืนยัน Order" : "Review payment slips and confirm orders."}
            </p>
          </div>
          <AdminOrdersClient locale={locale} />
        </div>
      </section>
      <Footer />
    </>
  );
}
