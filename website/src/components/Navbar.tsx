"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const t = useTranslations("Nav");
  const tBrand = useTranslations("Brand");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/${locale}/features`, label: t("features") },
    { href: `/${locale}/pricing`, label: t("pricing") },
    { href: `/${locale}/docs`, label: t("docs") },
    { href: `/${locale}/download`, label: t("download") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const otherLocale = locale === "th" ? "en" : "th";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              C
            </div>
            <div className="font-black text-lg tracking-tight">
              <span className="text-slate-900">CNC</span>{" "}
              <span className="text-blue-600">Costify</span>{" "}
              <span className="text-slate-500">AI</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`/${otherLocale}`}
              className="px-2 py-1 text-xs font-bold border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              {otherLocale.toUpperCase()}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold rounded-md shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:scale-105"
            >
              {t("tryFree")}
            </Link>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-md"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-200 mt-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 rounded-md"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-slate-200 pt-2 flex gap-2 px-3">
              <Link
                href={`/${otherLocale}`}
                className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-md"
              >
                {otherLocale.toUpperCase()}
              </Link>
              <Link
                href={`/${locale}/login`}
                onClick={() => setOpen(false)}
                className="flex-1 text-center px-3 py-2 text-sm font-medium border border-slate-300 rounded-md"
              >
                {t("login")}
              </Link>
              <Link
                href={`/${locale}/signup`}
                onClick={() => setOpen(false)}
                className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-md"
              >
                {t("tryFree")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
