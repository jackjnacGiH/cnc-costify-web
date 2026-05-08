"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, KeyRound, Users } from "lucide-react";

const TABS = [
  { key: "orders",  href: "/admin/orders",  icon: ShieldCheck, label: { th: "คำสั่งซื้อ",       en: "Orders" } },
  { key: "license", href: "/admin/license", icon: KeyRound,    label: { th: "Generate License", en: "Generate License" } },
  { key: "users",   href: "/admin/users",   icon: Users,       label: { th: "ผู้ใช้",          en: "Users" } },
] as const;

export function AdminTabs({ locale }: { locale: string }) {
  const pathname = usePathname() || "";
  return (
    <div className="border-b border-slate-200 mb-6 -mx-4 sm:mx-0">
      <nav className="flex items-center gap-1 px-4 sm:px-0 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const href = `/${locale}${t.href}`;
          // Active when current path starts with the tab's href (so /admin/users/123 highlights "Users")
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={t.key}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {t.label[locale as "th" | "en"] || t.label.en}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
