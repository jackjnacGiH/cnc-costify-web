import { setRequestLocale } from "next-intl/server";
import { PageStub } from "@/components/PageStub";

type Props = { params: Promise<{ locale: string }> };

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <PageStub
      locale={locale}
      title={locale === "th" ? "คู่มือการใช้งาน" : "User Documentation"}
      description={locale === "th" ? "คู่มือการใช้งาน CNC Costify AI V5.0 ฉบับสมบูรณ์" : "Complete user guide for CNC Costify AI V5.0"}
      comingSoonText={locale === "th" ? "กำลังจัดทำ Online viewer — ติดต่อ info@cnccostify.cloud เพื่อขอ PDF" : "Online viewer in progress — contact info@cnccostify.cloud for PDF"}
    />
  );
}
