"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, User as UserIcon, LogOut } from "lucide-react";

type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  plan?: string;
} | null;

type LocalLicense = {
  status: "active" | "grace" | null;
  days_left: number | null;
} | null;

export function Navbar() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser>(null);
  const [localLicense, setLocalLicense] = useState<LocalLicense>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Fetch /api/auth/me + /api/account/quota (for license.dat override)
  // on mount + when window regains focus.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [meRes, quotaRes] = await Promise.all([
          fetch("/api/auth/me", { credentials: "include", cache: "no-store" }),
          fetch("/api/account/quota", { credentials: "include", cache: "no-store" }).catch(() => null),
        ]);
        if (cancelled) return;
        if (meRes.ok) {
          const data = await meRes.json().catch(() => null);
          setUser(data?.ok ? data.user : null);
        } else {
          setUser(null);
        }
        if (quotaRes && quotaRes.ok) {
          const qd = await quotaRes.json().catch(() => null);
          setLocalLicense(qd?.ok ? (qd.local_license || null) : null);
        } else {
          setLocalLicense(null);
        }
      } catch { setUser(null); setLocalLicense(null); }
      finally { if (!cancelled) setAuthLoaded(true); }
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { cancelled = true; window.removeEventListener("focus", onFocus); };
  }, []);

  // Effective plan = license.dat override (if any) → user.plan → 'free'
  const effectivePlan = (() => {
    if (localLicense && (localLicense.status === "active" || localLicense.status === "grace")) {
      const days = localLicense.days_left ?? 0;
      return days > 5 * 365 ? "lifetime" : "yearly";
    }
    return user?.plan || "free";
  })();
  const planFromLicenseDat = effectivePlan !== (user?.plan || "free");

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /* ignore */ }
    setUser(null);
    setAccountMenuOpen(false);
    setOpen(false);
    // Hard redirect to home so server components re-render without session
    window.location.href = `/${locale}`;
  };

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/pricing`, label: t("pricing") },
    { href: `/${locale}/docs`, label: t("docs") },
    { href: `/${locale}/download`, label: t("download") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const otherLocale = locale === "th" ? "en" : "th";

  // Initials for avatar
  const initials = (user?.name || user?.email || "?")
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

  // Close dropdown on outside click
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-account-menu]")) setAccountMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [accountMenuOpen]);

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

            {/* Auth state — show login/signup OR account button */}
            {!authLoaded ? (
              <div className="w-24 h-8 bg-slate-100 rounded-md animate-pulse" />
            ) : user ? (
              <div className="relative" data-account-menu>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.name || user.email.split("@")[0]}
                  </span>
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs text-slate-500">
                        {locale === "th" ? "เข้าสู่ระบบเป็น" : "Signed in as"}
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate">{user.email}</div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          effectivePlan === "free" ? "bg-slate-100 text-slate-700"
                          : effectivePlan === "monthly" ? "bg-blue-100 text-blue-700"
                          : effectivePlan === "yearly" ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-800"
                        }`}>
                          {effectivePlan}
                        </span>
                        {planFromLicenseDat && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            (license.dat)
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/${locale}/account`}
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon size={14} />
                      {locale === "th" ? "บัญชีของฉัน" : "My Account"}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={14} />
                      {locale === "th" ? "ออกจากระบบ" : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
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
            {/* Account block when signed in */}
            {user && (
              <div className="mt-2 mb-2 mx-1 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">{user.name || user.email}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/${locale}/account`}
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold rounded-md"
                  >
                    {locale === "th" ? "บัญชีของฉัน" : "My Account"}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-sm font-bold rounded-md"
                  >
                    {locale === "th" ? "ออก" : "Sign out"}
                  </button>
                </div>
              </div>
            )}

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

              {!user && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
