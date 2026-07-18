"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Phone, Mail, MapPin, Globe } from "lucide-react";

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const locale = useLocale();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
                C
              </div>
              <div className="font-black text-lg tracking-tight text-white">
                CNC Costify <span className="text-blue-400">AI</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4 max-w-md">{t("company")}</p>
            <p className="text-xs text-slate-500 mb-4 max-w-md leading-relaxed">{t("address")}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone size={14} className="text-blue-400 flex-shrink-0" />
                <span>{t("phone")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail size={14} className="text-blue-400 flex-shrink-0" />
                <a href="mailto:info@cnccostify.cloud" className="hover:text-blue-400">
                  info@cnccostify.cloud
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Globe size={14} className="text-blue-400 flex-shrink-0" />
                <a href="https://www.cnccostify.cloud" className="hover:text-blue-400">
                  www.cnccostify.cloud
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">
              {t("links.product")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/features`} className="hover:text-blue-400">{tNav("features")}</Link></li>
              <li><Link href={`/${locale}/pricing`} className="hover:text-blue-400">{tNav("pricing")}</Link></li>
              <li><Link href={`/${locale}/download`} className="hover:text-blue-400">{tNav("download")}</Link></li>
              <li><Link href={`/${locale}/docs`} className="hover:text-blue-400">{tNav("docs")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">
              {t("links.company")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/about`} className="hover:text-blue-400">{tNav("about")}</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:text-blue-400">{tNav("contact")}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="hover:text-blue-400">Privacy</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:text-blue-400">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-xs text-slate-500 text-center">
          {t("rights")}
        </div>
      </div>
    </footer>
  );
}
