import { setRequestLocale } from "next-intl/server";
import { PageStub } from "@/components/PageStub";

type Props = { params: Promise<{ locale: string }> };

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <PageStub
      locale={locale}
      title={locale === "th" ? "ฟีเจอร์ทั้งหมด" : "All Features"}
      description={locale === "th" ? "หน้าแสดงรายละเอียดฟีเจอร์ทั้งหมดของ CNC Costify AI V5.0" : "Complete feature breakdown of CNC Costify AI V5.0"}
      comingSoonText={locale === "th" ? "กำลังพัฒนา — ดูฟีเจอร์ที่หน้า Pricing ก่อน" : "Coming soon — see Pricing page for feature list"}
    />
  );
}
