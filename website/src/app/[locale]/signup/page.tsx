import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Navbar />
      <section className="bg-gradient-to-b from-blue-50 via-white to-slate-50 py-12 min-h-[calc(100vh-200px)] flex items-center">
        <div className="w-full">
          <AuthForm mode="signup" />
        </div>
      </section>
      <Footer />
    </>
  );
}
