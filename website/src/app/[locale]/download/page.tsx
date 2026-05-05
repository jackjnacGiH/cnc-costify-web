import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, Monitor, HardDrive, Cpu, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white shadow-xl mb-4">
              <Download size={28} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              {locale === "th" ? "ดาวน์โหลด CNC Costify AI" : "Download CNC Costify AI"}
            </h1>
            <p className="text-lg text-slate-600">
              {locale === "th"
                ? "เวอร์ชั่น Desktop สำหรับ Windows — ติดตั้งและใช้งานแบบ Local รองรับไฟล์ขนาดใหญ่"
                : "Desktop version for Windows — local install supports large files"}
            </p>
          </div>

          {/* Login required notice */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <ShieldCheck size={32} className="text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-black text-lg text-amber-900 mb-2">
                {locale === "th" ? "ต้องเข้าสู่ระบบก่อนดาวน์โหลด" : "Login required to download"}
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                {locale === "th"
                  ? "ดาวน์โหลดได้เฉพาะแพ็กเกจ Yearly และ Lifetime — กรุณาเข้าสู่ระบบหรือซื้อแพ็กเกจก่อน"
                  : "Download requires Yearly or Lifetime plan — please sign in or purchase a plan"}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/login`}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg"
                >
                  {locale === "th" ? "เข้าสู่ระบบ" : "Sign in"}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="px-4 py-2 bg-white border-2 border-amber-400 hover:bg-amber-100 text-amber-800 text-sm font-bold rounded-lg"
                >
                  {locale === "th" ? "ดูแพ็กเกจ" : "View Plans"}
                </Link>
              </div>
            </div>
          </div>

          {/* System requirements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-4">
              {locale === "th" ? "ความต้องการของระบบ" : "System Requirements"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Monitor size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{locale === "th" ? "ระบบปฏิบัติการ" : "OS"}</div>
                  <div className="text-sm text-slate-600">Windows 10 / 11 (64-bit)</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Cpu size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">RAM</div>
                  <div className="text-sm text-slate-600">{locale === "th" ? "ขั้นต่ำ 4 GB (แนะนำ 8 GB)" : "Minimum 4 GB (recommended 8 GB)"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HardDrive size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{locale === "th" ? "พื้นที่ว่าง" : "Storage"}</div>
                  <div className="text-sm text-slate-600">{locale === "th" ? "อย่างน้อย 2 GB" : "At least 2 GB"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Download size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{locale === "th" ? "ขนาดไฟล์ติดตั้ง" : "Installer size"}</div>
                  <div className="text-sm text-slate-600">~660 MB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
