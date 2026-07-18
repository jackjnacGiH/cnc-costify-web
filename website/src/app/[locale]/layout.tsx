import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { FeatureSuggestionWidget } from "@/components/FeatureSuggestionWidget";
import { MobileActionBar } from "@/components/MobileActionBar";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CNC Costify AI V5.14 — คำนวณราคา CNC ด้วย AI ใน 5 วินาที",
  description: "วิเคราะห์ไฟล์ STEP / PDF / JPG อัตโนมัติด้วย AI พร้อมฐานข้อมูลวัสดุ 100+ รายการ บันทึกผลลัพธ์ลง Excel ได้ทันที",
  keywords: ["CNC", "ราคา CNC", "AI", "STEP file", "Cost calculator", "Costify", "CNC ไทย"],
  metadataBase: new URL("https://www.cnccostify.cloud"),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        <NextIntlClientProvider messages={messages}>
          {children}
          <MobileActionBar />
          <FeatureSuggestionWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
