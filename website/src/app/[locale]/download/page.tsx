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

          {/* Download CTA */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <h3 className="font-black text-lg text-slate-900 mb-1">
                  {locale === "th" ? "CNC Costify AI V5.1 — Windows" : "CNC Costify AI V5.1 — Windows"}
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  {locale === "th"
                    ? "ทดลองฟรี 3 ไฟล์/วัน — เข้าสู่ระบบด้วยบัญชีเว็บไซต์"
                    : "Free trial: 3 files/day — sign in with your web account"}
                </p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>✓ {locale === "th" ? "STEP volume + Stock Size อัตโนมัติ (OpenCASCADE)" : "STEP volume + Stock Size auto (OpenCASCADE)"}</li>
                  <li>✓ {locale === "th" ? "PDF/JPG AI Costify (Multi-AI: Gemini + OpenRouter)" : "PDF/JPG AI Costify (Multi-AI)"}</li>
                  <li>✓ {locale === "th" ? "Material Database 100+ + Excel export" : "Material DB 100+ · Excel export"}</li>
                </ul>
              </div>
              <a
                href="/downloads/CNC-Costify-AI-V5.1-Setup.exe"
                download
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <Download size={18} />
                {locale === "th" ? "ดาวน์โหลด V5.1" : "Download V5.1"}
              </a>
            </div>
          </div>

          {/* Quick start */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-3">
              {locale === "th" ? "เริ่มใช้งาน 3 ขั้นตอน" : "Get started in 3 steps"}
            </h2>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                <span>{locale === "th" ? "ดาวน์โหลด + ติดตั้ง CNC Costify AI V5.1" : "Download + install CNC Costify AI V5.1"}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                <span>
                  {locale === "th"
                    ? <>เปิดแอป → กด <strong>"เข้าสู่ระบบด้วยบัญชีเว็บไซต์"</strong> (หรือนำเข้า license.dat)</>
                    : <>Open the app → click <strong>"Sign in via Website"</strong> (or import license.dat)</>}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                <span>{locale === "th" ? "อัปโหลดไฟล์ STEP/PDF/JPG → ได้ราคาทันที" : "Upload STEP/PDF/JPG → instant cost"}</span>
              </li>
            </ol>
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
