import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserOrdersClient } from "@/components/UserOrdersClient";

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
  } catch { return null; }
}

export default async function MyOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/account/orders`)}`);
  }

  return (
    <>
      <Navbar />
      <section className="bg-slate-50 py-8 min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}/account`} className="text-sm text-blue-600 hover:underline mb-4 inline-block">
            ← {locale === "th" ? "กลับไปบัญชีของฉัน" : "Back to my account"}
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-1">
            📋 {locale === "th" ? "ประวัติคำสั่งซื้อ" : "Order History"}
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            {locale === "th" ? "Order ทั้งหมดของคุณ + สถานะปัจจุบัน" : "All your orders + current status"}
          </p>
          <UserOrdersClient locale={locale} />
        </div>
      </section>
      <Footer />
    </>
  );
}
