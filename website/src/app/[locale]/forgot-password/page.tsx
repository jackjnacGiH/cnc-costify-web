import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 min-h-[70vh] flex items-center">
        <div className="max-w-md mx-auto px-4 w-full">
          <ForgotPasswordForm locale={locale} />
        </div>
      </section>
      <Footer />
    </>
  );
}
