import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminTabs } from "@/components/AdminTabs";
import { UserDetailCards } from "@/components/UserDetailCards";
import { ShieldAlert, ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ locale: string; id: string }> };

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

async function fetchUserDetail(userId: number, cookie: string) {
  try {
    const r = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
      headers: { Cookie: cookie }, cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.ok ? data : null;
  } catch { return null; }
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const userId = parseInt(id, 10);
  if (!userId) notFound();

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/admin/users/${userId}`)}`);
  }
  const isAdmin = ADMIN_EMAILS.includes(String(user.email).toLowerCase());

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <section className="bg-rose-50 py-16 min-h-[80vh]">
          <div className="max-w-md mx-auto px-4 text-center">
            <ShieldAlert size={64} className="mx-auto text-rose-600 mb-4" />
            <h1 className="text-2xl font-black text-slate-900">
              {locale === "th" ? "ไม่มีสิทธิ์เข้าถึง" : "Access denied"}
            </h1>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const detail = await fetchUserDetail(userId, cookieHeader);
  if (!detail) notFound();

  return (
    <>
      <Navbar />
      <section className="bg-slate-50 py-8 min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3">
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              🛡️ {locale === "th" ? "Admin Panel" : "Admin Panel"}
            </h1>
          </div>
          <AdminTabs locale={locale} />
          <Link href={`/${locale}/admin/users`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
            <ArrowLeft size={14} />
            {locale === "th" ? "กลับไปรายการผู้ใช้" : "Back to user list"}
          </Link>
          <UserDetailCards locale={locale} initial={detail} />
        </div>
      </section>
      <Footer />
    </>
  );
}
