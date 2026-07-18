import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  description: string;
  locale: string;
  comingSoonText?: string;
};

export function PageStub({ title, description, locale, comingSoonText }: Props) {
  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 min-h-[60vh] flex items-center">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{title}</h1>
          <p className="text-lg text-slate-600 mb-8">{description}</p>
          {comingSoonText && (
            <div className="inline-block px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 font-bold mb-8">
              🚧 {comingSoonText}
            </div>
          )}
          <div>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all"
            >
              <ArrowLeft size={20} />
              {locale === "th" ? "กลับหน้าหลัก" : "Back to Home"}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
