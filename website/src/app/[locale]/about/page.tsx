import { setRequestLocale } from "next-intl/server";
import { PageStub } from "@/components/PageStub";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <PageStub
      locale={locale}
      title={locale === "th" ? "เกี่ยวกับเรา" : "About Us"}
      description={locale === "th" ? "บริษัท เจ แนค (ประเทศไทย) จำกัด — พัฒนาเครื่องมือ AI สำหรับอุตสาหกรรม CNC" : "J Nac (Thailand) Co., Ltd. — AI tools for the CNC industry"}
      comingSoonText={locale === "th" ? "หน้าแนะนำบริษัท + ทีม + Mission กำลังจัดทำ" : "Company intro + team + mission in progress"}
    />
  );
}
