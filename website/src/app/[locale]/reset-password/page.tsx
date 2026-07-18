import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 min-h-[70vh] flex items-center">
        <div className="max-w-md mx-auto px-4 w-full">
          <ResetPasswordForm token={token || null} locale={locale} />
        </div>
      </section>
      <Footer />
    </>
  );
}
