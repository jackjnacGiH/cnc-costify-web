import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Phone, Mail, MapPin, Globe, MessageCircle } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 min-h-[80vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              {locale === "th" ? "ติดต่อเรา" : "Contact Us"}
            </h1>
            <p className="text-lg text-slate-600">
              {locale === "th"
                ? "พร้อมตอบคำถามทุกข้อสงสัย — เราตอบกลับภายใน 24 ชม."
                : "We respond to every inquiry within 24 hours"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact info */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Phone size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 mb-1">
                      {locale === "th" ? "โทรศัพท์" : "Phone"}
                    </h3>
                    <a href="tel:0811442000" className="text-blue-600 hover:underline font-bold">
                      08 1144 2000
                    </a>
                    <p className="text-xs text-slate-500 mt-1">
                      {locale === "th" ? "จันทร์-ศุกร์ 8:00-17:00" : "Mon-Fri 8:00-17:00"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 mb-1">{locale === "th" ? "อีเมล" : "Email"}</h3>
                    <a href="mailto:info@cnccostify.cloud" className="text-emerald-600 hover:underline font-bold">
                      info@cnccostify.cloud
                    </a>
                    <p className="text-xs text-slate-500 mt-1">
                      {locale === "th" ? "ตอบกลับใน 24 ชม." : "Reply within 24 hours"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Globe size={22} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 mb-1">{locale === "th" ? "เว็บไซต์" : "Website"}</h3>
                    <a href="https://www.cnccostify.cloud" className="text-purple-600 hover:underline font-bold">
                      www.cnccostify.cloud
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-3 mb-4">
                <MapPin size={22} className="text-rose-600 flex-shrink-0 mt-1" />
                <h3 className="font-black text-slate-900">
                  {locale === "th" ? "ที่ตั้งบริษัท" : "Company Address"}
                </h3>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed mb-4">
                <p className="font-bold mb-2">
                  {locale === "th" ? "บริษัท เจ แนค (ประเทศไทย) จำกัด" : "J Nac (Thailand) Co., Ltd."}
                </p>
                <p>
                  {locale === "th"
                    ? "เลขที่ 84 หมู่ 2 ซ.สุนทรวิภาค ถ.บางพลี-ตำหรุ ต.แพรกษาใหม่ อ.เมือง จ.สมุทรปราการ 10280"
                    : "84 Moo 2, Soi Soontornvipark, Bangplee-Tamru Rd., Praeksamai, Mueang, Samut Prakan 10280, Thailand"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs text-slate-600">
                <MessageCircle size={14} className="inline mr-1 text-blue-500" />
                {locale === "th"
                  ? "ฟอร์มติดต่อจะเปิดให้ใช้งานเร็วๆ นี้ — ตอนนี้กรุณาติดต่อทางอีเมลหรือโทรศัพท์โดยตรง"
                  : "Contact form coming soon — please email or call us directly for now"}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
