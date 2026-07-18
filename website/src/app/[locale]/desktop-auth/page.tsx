import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DesktopAuthForm } from "@/components/DesktopAuthForm";
import { Monitor } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
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

export default async function DesktopAuthPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { code } = await searchParams;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cnc_session");
  const cookieHeader = sessionCookie ? `cnc_session=${sessionCookie.value}` : "";
  const user = sessionCookie ? await fetchMe(cookieHeader) : null;

  // Not logged in → bounce to login then return here
  if (!user) {
    const next = `/${locale}/desktop-auth${code ? `?code=${encodeURIComponent(code)}` : ""}`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }

  const missingCode = !code;

  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-slate-50 py-16 min-h-[80vh]">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Monitor size={32} className="text-blue-600" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 text-center mb-2">
              {locale === "th" ? "เชื่อมต่อ Desktop App" : "Connect Desktop App"}
            </h1>

            {missingCode ? (
              <p className="text-sm text-slate-600 text-center">
                {locale === "th"
                  ? "ไม่พบรหัสเชื่อมต่อ — กรุณาเปิด CNC Costify AI Desktop แล้วกด \"Sign In\" อีกครั้ง"
                  : "No authorization code — please open CNC Costify AI Desktop and click \"Sign In\" again."}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600 text-center mb-2">
                  {locale === "th"
                    ? <>คุณกำลังจะอนุญาตให้ <strong>CNC Costify AI Desktop</strong> เข้าถึงบัญชีของคุณ</>
                    : <>You are about to authorize <strong>CNC Costify AI Desktop</strong> to access your account.</>}
                </p>
                <div className="bg-slate-50 rounded-lg p-4 my-5 text-sm">
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">
                    {locale === "th" ? "ลงชื่อเข้าใช้เป็น" : "Signed in as"}
                  </div>
                  <div className="font-bold text-slate-900">{user.name || user.email}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <DesktopAuthForm code={code as string} locale={locale} />
                <p className="mt-4 text-xs text-slate-500 text-center">
                  {locale === "th"
                    ? "หลังอนุญาต Desktop App จะรับ token อัตโนมัติ — คุณสามารถปิดหน้านี้ได้"
                    : "After authorizing, the Desktop App will receive its token automatically — you can close this page."}
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
