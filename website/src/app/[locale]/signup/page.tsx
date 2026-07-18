import { Suspense } from "react";
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
          <Suspense fallback={<div className="max-w-md mx-auto h-96 bg-white/40 rounded-2xl animate-pulse" />}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </section>
      <Footer />
    </>
  );
}
