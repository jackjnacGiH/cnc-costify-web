import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Shield, Database, Eye, Lock, Cookie, Globe, UserCheck, Mail, Phone,
  FileText, AlertCircle, Server, Key, Trash2, RefreshCw, Settings2,
  ExternalLink, Info, ArrowRight,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTh = locale === "th";

  const lastUpdated = isTh ? "12 พฤษภาคม 2569" : "12 May 2026";

  const sections = [
    { id: "overview",   label: isTh ? "ภาพรวม"                           : "Overview",             icon: Shield },
    { id: "collect",    label: isTh ? "ข้อมูลที่เก็บรวบรวม"             : "Data We Collect",      icon: Database },
    { id: "use",        label: isTh ? "วัตถุประสงค์ในการใช้ข้อมูล"      : "How We Use Data",      icon: Eye },
    { id: "ai",         label: isTh ? "การใช้งาน AI"                    : "AI Processing",        icon: Server },
    { id: "share",      label: isTh ? "การเปิดเผยข้อมูล"                 : "Data Sharing",         icon: Globe },
    { id: "storage",    label: isTh ? "การจัดเก็บและความปลอดภัย"        : "Storage & Security",   icon: Lock },
    { id: "retention",  label: isTh ? "ระยะเวลาเก็บข้อมูล"               : "Retention",            icon: RefreshCw },
    { id: "cookies",    label: isTh ? "คุกกี้และเทคโนโลยีติดตาม"        : "Cookies & Tracking",   icon: Cookie },
    { id: "rights",     label: isTh ? "สิทธิของคุณ (PDPA)"               : "Your Rights (PDPA)",   icon: UserCheck },
    { id: "children",   label: isTh ? "ผู้เยาว์"                         : "Minors",               icon: AlertCircle },
    { id: "changes",    label: isTh ? "การเปลี่ยนแปลงนโยบาย"            : "Policy Changes",       icon: FileText },
    { id: "contact",    label: isTh ? "ติดต่อ"                           : "Contact",              icon: Mail },
  ];

  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-slate-50 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-transparent blur-3xl rounded-full" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-100 to-blue-100 border border-emerald-200 rounded-full text-sm font-bold text-emerald-800 mb-6">
            <Shield size={16} className="text-emerald-600" />
            {isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy"}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {isTh ? "ความเป็นส่วนตัวของคุณ " : "Your privacy is "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isTh ? "คือสิ่งสำคัญ" : "our priority"}
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            {isTh
              ? "เราเชื่อในความโปร่งใส — เอกสารนี้บอกชัดเจนว่าเราเก็บข้อมูลอะไร ใช้ทำอะไร และคุณมีสิทธิอะไรบ้าง"
              : "We believe in transparency — this document clearly explains what we collect, how we use it, and your rights"}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <RefreshCw size={12} />
            {isTh ? "ปรับปรุงล่าสุด:" : "Last updated:"} <span className="font-bold text-slate-700">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* ── Main: TOC + Content ───────────────────────────────── */}
      <section className="bg-white pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* ── Sticky TOC ── */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 px-2">
                    {isTh ? "สารบัญ" : "Contents"}
                  </div>
                  <nav className="space-y-0.5">
                    {sections.map(({ id, label, icon: Icon }) => (
                      <a
                        key={id}
                        href={`#${id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors group"
                      >
                        <Icon size={14} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                        <span className="font-medium">{label}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* ── Content ── */}
            <article className="lg:col-span-3 space-y-10">

              {/* 1. Overview */}
              <Section id="overview" icon={Shield} title={isTh ? "ภาพรวม" : "Overview"}>
                <p>
                  {isTh
                    ? <><b>บริษัท เจ แนค (ประเทศไทย) จำกัด</b> (&ldquo;เรา&rdquo;) ผู้ให้บริการ CNC Costify AI ตระหนักถึงความสำคัญของข้อมูลส่วนบุคคลของคุณ และยึดมั่นในการปฏิบัติตาม พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัด</>
                    : <><b>J Nac (Thailand) Co., Ltd.</b> (&ldquo;we&rdquo;), the provider of CNC Costify AI, recognizes the importance of your personal data and is committed to complying with Thailand&apos;s Personal Data Protection Act B.E. 2562 (PDPA).</>}
                </p>
                <p>
                  {isTh
                    ? "นโยบายฉบับนี้อธิบายว่าเราเก็บข้อมูลใดบ้าง วิธีใช้ การจัดเก็บ ระยะเวลาเก็บ และสิทธิของคุณในฐานะเจ้าของข้อมูล"
                    : "This policy explains what data we collect, how we use it, how it's stored, retention periods, and your rights as the data subject."}
                </p>
                <Callout type="tip">
                  {isTh
                    ? "หลักการสำคัญ: ไฟล์แบบงาน (STEP/PDF/JPG) ของคุณ ไม่ได้ถูกส่งขึ้น Cloud ของเรา — เก็บไว้บนเครื่องคุณเสมอ"
                    : "Key principle: Your drawing files (STEP/PDF/JPG) are never uploaded to our cloud — they stay on your machine"}
                </Callout>
              </Section>

              {/* 2. Data Collected */}
              <Section id="collect" icon={Database} title={isTh ? "ข้อมูลที่เก็บรวบรวม" : "Data We Collect"}>
                <p>
                  {isTh ? "เราเก็บข้อมูลเฉพาะที่จำเป็นต่อการให้บริการเท่านั้น แบ่งเป็น 3 ประเภท:" : "We collect only data necessary for service operation, in three categories:"}
                </p>

                <div className="space-y-3 mt-3">
                  <DataCard
                    icon={UserCheck}
                    color="from-blue-500 to-cyan-500"
                    title={isTh ? "ข้อมูลบัญชี (Account)" : "Account Data"}
                    items={isTh
                      ? ["อีเมล (ที่ใช้สมัครและล็อกอิน)", "ชื่อ (ถ้ากรอก)", "ชื่อบริษัท (ถ้ากรอก)", "Hardware ID (ผูกกับ License ตามแพ็กเกจ)", "Password (เข้ารหัสด้วย bcrypt — ทีมงานไม่สามารถเห็นได้)"]
                      : ["Email (registration/login)", "Name (if provided)", "Company name (if provided)", "Hardware ID (bound to your license)", "Password (bcrypt-hashed — never visible to staff)"]
                    }
                  />
                  <DataCard
                    icon={Eye}
                    color="from-purple-500 to-pink-500"
                    title={isTh ? "ข้อมูลการใช้งาน (Usage)" : "Usage Data"}
                    items={isTh
                      ? ["จำนวนไฟล์ที่คำนวณต่อวัน (เพื่อจัดการ quota)", "ประเภทไฟล์ (STEP/PDF/JPG) — ไม่เก็บเนื้อหา", "วันเวลาที่ใช้งาน + Device Token", "IP Address (เพื่อความปลอดภัย)"]
                      : ["Files processed per day (for quota management)", "File type (STEP/PDF/JPG) — content NOT stored", "Usage timestamps + device token", "IP address (for security)"]
                    }
                  />
                  <DataCard
                    icon={Globe}
                    color="from-amber-500 to-orange-500"
                    title={isTh ? "ข้อมูลการชำระเงิน (Payment)" : "Payment Data"}
                    items={isTh
                      ? ["สลิปการโอน (เก็บชั่วคราวเพื่อยืนยัน Order)", "เลขที่ Order + จำนวนเงิน", "ไม่เก็บเลขบัตรเครดิต / ข้อมูลธนาคารใดๆ"]
                      : ["Payment slip (temporary, for order verification)", "Order number + amount", "No credit card / bank info stored"]
                    }
                  />
                </div>

                <Callout type="info">
                  {isTh
                    ? "เราไม่เก็บเนื้อหาไฟล์ STEP / PDF / JPG ของคุณ — ระบบทำงานบนเครื่องคุณ"
                    : "We do NOT store the contents of your STEP / PDF / JPG files — processing happens on your machine"}
                </Callout>
              </Section>

              {/* 3. How we use */}
              <Section id="use" icon={Eye} title={isTh ? "วัตถุประสงค์ในการใช้ข้อมูล" : "How We Use Data"}>
                <ul className="space-y-2.5">
                  {(isTh
                    ? [
                        "ยืนยันตัวตนและให้บริการตามแพ็กเกจที่คุณซื้อ",
                        "จัดการ Quota การใช้งานรายวัน (Free: 3 ไฟล์/วัน, Monthly: 30 ไฟล์/วัน)",
                        "ออกใบกำกับภาษีและการชำระเงิน",
                        "ส่งอีเมลแจ้งเตือนสำคัญ (License ใกล้หมด, อัปเดตเวอร์ชัน, ปัญหาความปลอดภัย)",
                        "ปรับปรุงการใช้งานและพัฒนาฟีเจอร์ใหม่ (จากสถิติรวม ไม่ระบุตัวตน)",
                        "ปฏิบัติตามกฎหมายที่เกี่ยวข้อง",
                      ]
                    : [
                        "Authenticate and provide services per your purchased plan",
                        "Manage daily usage quotas (Free: 3 files/day, Monthly: 30 files/day)",
                        "Issue invoices and process payments",
                        "Send critical email notifications (license expiry, updates, security)",
                        "Improve usability and develop new features (aggregate, non-identifiable stats)",
                        "Comply with applicable laws",
                      ]
                  ).map((item, i) => (
                    <li key={i} className="flex gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Callout type="warn">
                  {isTh
                    ? "เราจะไม่ใช้ข้อมูลของคุณเพื่อขายโฆษณา ฝึกโมเดล AI ของเรา หรือส่งต่อให้บุคคลที่สามเพื่อการตลาด"
                    : "We do NOT use your data to sell ads, train our AI models, or share with third parties for marketing"}
                </Callout>
              </Section>

              {/* 4. AI Processing */}
              <Section id="ai" icon={Server} title={isTh ? "การใช้งาน AI" : "AI Processing"}>
                <p>
                  {isTh
                    ? "CNC Costify AI ใช้บริการ AI ภายนอกเพื่อวิเคราะห์แบบงาน คุณควรเข้าใจสิ่งที่เกิดขึ้น:"
                    : "CNC Costify AI uses external AI services to analyze drawings. You should understand what happens:"}
                </p>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <ProviderCard
                    title="Google Gemini"
                    badge={isTh ? "ผู้ให้บริการหลัก" : "Primary"}
                    color="from-blue-500 to-indigo-600"
                    rows={isTh
                      ? [
                          ["ข้อมูลส่ง", "เฉพาะรูป/PDF ที่คุณอัปโหลด → ส่งเฉพาะเนื้อหาแบบงาน"],
                          ["จุดประสงค์", "วิเคราะห์ Material, Stock, Coating, Tolerance"],
                          ["การเก็บ", "ตาม Google AI Privacy Policy"],
                        ]
                      : [
                          ["Data sent", "Only the drawing image/PDF you upload"],
                          ["Purpose", "Extract Material, Stock, Coating, Tolerance"],
                          ["Retention", "Per Google AI Privacy Policy"],
                        ]
                    }
                    link="https://ai.google.dev/gemini-api/terms"
                  />
                  <ProviderCard
                    title="OpenRouter"
                    badge={isTh ? "สำรองอัตโนมัติ" : "Auto-fallback"}
                    color="from-amber-500 to-orange-600"
                    rows={isTh
                      ? [
                          ["ข้อมูลส่ง", "เฉพาะข้อความ prompt + รูปแบบงาน"],
                          ["จุดประสงค์", "ใช้แทน Gemini เมื่อ quota เต็ม"],
                          ["การเก็บ", "ตาม OpenRouter Privacy Policy"],
                        ]
                      : [
                          ["Data sent", "Prompt text + drawing image"],
                          ["Purpose", "Replace Gemini when quota exhausted"],
                          ["Retention", "Per OpenRouter Privacy Policy"],
                        ]
                    }
                    link="https://openrouter.ai/privacy"
                  />
                </div>

                <Callout type="info">
                  {isTh
                    ? "AI ทั้งสองตัวเป็น stateless — ไม่นำข้อมูลของคุณไปฝึกโมเดลในการเรียกใช้แบบ API"
                    : "Both AI providers operate stateless via API — your data is not used to train their models"}
                </Callout>
              </Section>

              {/* 5. Data Sharing */}
              <Section id="share" icon={Globe} title={isTh ? "การเปิดเผยข้อมูล" : "Data Sharing"}>
                <p>
                  {isTh ? "เราเปิดเผยข้อมูลของคุณกับบุคคลที่สามเฉพาะกรณีต่อไปนี้:" : "We share your data only in the following circumstances:"}
                </p>
                <ul className="space-y-2.5 mt-3">
                  {(isTh
                    ? [
                        { bold: "ผู้ให้บริการ AI",        rest: " (Google Gemini, OpenRouter) — เฉพาะเนื้อหาแบบงานที่ส่งวิเคราะห์" },
                        { bold: "ผู้ให้บริการอีเมล",      rest: " (Hostinger SMTP) — สำหรับส่งอีเมลยืนยันและแจ้งเตือน" },
                        { bold: "ผู้ให้บริการ Hosting",   rest: " (Vercel, Hostinger VPS) — เพื่อให้บริการเว็บไซต์และ API" },
                        { bold: "หน่วยงานราชการ",        rest: " — เมื่อมีคำสั่งศาลหรือกฎหมายบังคับ" },
                      ]
                    : [
                        { bold: "AI Providers",          rest: " (Google Gemini, OpenRouter) — only the drawing content sent for analysis" },
                        { bold: "Email Provider",        rest: " (Hostinger SMTP) — to send verification and notification emails" },
                        { bold: "Hosting Providers",     rest: " (Vercel, Hostinger VPS) — to serve website and API" },
                        { bold: "Government Agencies",   rest: " — only when compelled by court order or law" },
                      ]
                  ).map((item, i) => (
                    <li key={i} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <span><b className="text-slate-900">{item.bold}</b>{item.rest}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 6. Storage & Security */}
              <Section id="storage" icon={Lock} title={isTh ? "การจัดเก็บและความปลอดภัย" : "Storage & Security"}>
                <div className="grid md:grid-cols-2 gap-3">
                  {(isTh
                    ? [
                        { icon: Key,       title: "Password",     desc: "เข้ารหัสด้วย bcrypt (12 rounds) — ทีมงานไม่สามารถเห็นรหัสผ่านของคุณได้" },
                        { icon: Lock,      title: "Session Token", desc: "JWT แบบ HttpOnly cookie — ป้องกัน XSS / CSRF" },
                        { icon: Shield,    title: "License File",  desc: "เซ็นด้วย Ed25519 cryptography — ตรวจสอบ offline ได้" },
                        { icon: Server,    title: "Database",      desc: "SQLite บน VPS Linux — มีการสำรองข้อมูลรายวัน" },
                        { icon: Globe,     title: "HTTPS Only",    desc: "ทุกการเชื่อมต่อใช้ TLS 1.3 — ไม่มีการรับส่งข้อมูลแบบ plaintext" },
                        { icon: Trash2,    title: "Slip Cleanup",  desc: "สลิปการโอนถูกลบหลังยืนยัน Order เสร็จ (30 วันสูงสุด)" },
                      ]
                    : [
                        { icon: Key,       title: "Passwords",     desc: "bcrypt (12 rounds) — staff cannot see your password" },
                        { icon: Lock,      title: "Session Tokens", desc: "JWT in HttpOnly cookies — XSS/CSRF protected" },
                        { icon: Shield,    title: "License Files",  desc: "Ed25519 cryptographic signatures — offline verifiable" },
                        { icon: Server,    title: "Database",       desc: "SQLite on Linux VPS — daily backups" },
                        { icon: Globe,     title: "HTTPS Only",     desc: "All connections use TLS 1.3 — no plaintext data" },
                        { icon: Trash2,    title: "Slip Cleanup",   desc: "Payment slips deleted after order confirmed (max 30 days)" },
                      ]
                  ).map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={16} className="text-emerald-600" />
                        <span className="font-black text-sm text-slate-900">{title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 7. Retention */}
              <Section id="retention" icon={RefreshCw} title={isTh ? "ระยะเวลาเก็บข้อมูล" : "Data Retention"}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "ประเภทข้อมูล" : "Data Type"}</th>
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "ระยะเวลาเก็บ" : "Retention"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isTh
                        ? [
                            ["บัญชีผู้ใช้",                   "ตลอดอายุการใช้งาน + 2 ปี หลังจากปิดบัญชี (ตาม PDPA)"],
                            ["ข้อมูลการใช้งานรายวัน",         "12 เดือน (เพื่อสถิติและบริการลูกค้า)"],
                            ["สลิปการโอน",                   "30 วันสูงสุด หลังยืนยัน Order"],
                            ["ใบกำกับภาษี / ใบเสร็จ",         "10 ปี (ตามกฎหมายภาษีไทย)"],
                            ["Device Token",                  "365 วัน หากไม่มีการใช้งาน — ลบอัตโนมัติ"],
                            ["Server Logs",                   "90 วัน หลังจากนั้นทำลายทิ้ง"],
                          ]
                        : [
                            ["User accounts",          "Lifetime of account + 2 years after closure (per PDPA)"],
                            ["Daily usage records",    "12 months (for stats and customer service)"],
                            ["Payment slips",          "Max 30 days after order confirmed"],
                            ["Invoices / Receipts",    "10 years (per Thai tax law)"],
                            ["Device tokens",          "365 days idle → auto-deleted"],
                            ["Server logs",            "90 days, then destroyed"],
                          ]
                      ).map(([type, period], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-3 py-2 font-bold text-slate-900">{type}</td>
                          <td className="px-3 py-2 text-slate-700">{period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* 8. Cookies */}
              <Section id="cookies" icon={Cookie} title={isTh ? "คุกกี้และเทคโนโลยีติดตาม" : "Cookies & Tracking"}>
                <p>
                  {isTh
                    ? "เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเฉพาะเท่าที่จำเป็น:"
                    : "We use cookies and similar technologies only as necessary:"}
                </p>
                <div className="space-y-2 mt-3">
                  {(isTh
                    ? [
                        { name: "cnc_session", desc: "HttpOnly cookie สำหรับยืนยันการล็อกอิน — อายุ 1-30 วัน" },
                        { name: "language",    desc: "บันทึกภาษาที่คุณเลือก (th/en) — เก็บไว้ใน localStorage ของ Browser" },
                      ]
                    : [
                        { name: "cnc_session", desc: "HttpOnly cookie for login authentication — 1-30 days" },
                        { name: "language",    desc: "Remembers your language choice (th/en) — stored in Browser localStorage" },
                      ]
                  ).map(({ name, desc }) => (
                    <div key={name} className="flex gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <code className="text-xs font-mono bg-slate-200 text-slate-800 px-2 py-1 rounded h-fit">{name}</code>
                      <span className="text-sm text-slate-700">{desc}</span>
                    </div>
                  ))}
                </div>
                <Callout type="info">
                  {isTh
                    ? "เราไม่ใช้ Google Analytics, Facebook Pixel, หรือ Tracking Cookie ทางการตลาด"
                    : "We do NOT use Google Analytics, Facebook Pixel, or marketing tracking cookies"}
                </Callout>
              </Section>

              {/* 9. Your Rights */}
              <Section id="rights" icon={UserCheck} title={isTh ? "สิทธิของคุณ (PDPA)" : "Your Rights (PDPA)"}>
                <p>
                  {isTh
                    ? "ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คุณมีสิทธิดังนี้:"
                    : "Under Thailand's PDPA, you have the following rights:"}
                </p>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {(isTh
                    ? [
                        { title: "สิทธิในการเข้าถึง",        desc: "ขอดูข้อมูลของคุณที่เราเก็บอยู่ได้ตลอด" },
                        { title: "สิทธิในการแก้ไข",         desc: "แก้ข้อมูลของคุณ เช่น อีเมล ชื่อ ที่ไม่ถูกต้อง" },
                        { title: "สิทธิในการลบ",            desc: "ขอลบบัญชีและข้อมูลของคุณได้ (Right to be Forgotten)" },
                        { title: "สิทธิในการคัดค้าน",       desc: "ปฏิเสธไม่ให้เราใช้ข้อมูลในบางกรณี" },
                        { title: "สิทธิในการถอนความยินยอม", desc: "ถอนการยินยอมในการใช้ข้อมูลเมื่อใดก็ได้" },
                        { title: "สิทธิในการรับโอน",        desc: "ขอข้อมูลของคุณในรูปแบบที่อ่านได้ด้วยเครื่อง" },
                      ]
                    : [
                        { title: "Right to Access",       desc: "Request to see all data we have about you anytime" },
                        { title: "Right to Rectify",      desc: "Correct inaccurate information (email, name, etc.)" },
                        { title: "Right to Erasure",      desc: "Request deletion of your account and data (Right to be Forgotten)" },
                        { title: "Right to Object",       desc: "Refuse our use of your data in certain cases" },
                        { title: "Right to Withdraw",     desc: "Withdraw consent at any time" },
                        { title: "Right to Portability",  desc: "Request your data in machine-readable format" },
                      ]
                  ).map(({ title, desc }) => (
                    <div key={title} className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
                      <div className="font-black text-slate-900 text-sm mb-1">{title}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
                <Callout type="tip">
                  {isTh
                    ? <>ส่งคำขอใช้สิทธิได้ที่ <a href="mailto:info@cnccostify.cloud" className="font-bold text-emerald-700 hover:underline">info@cnccostify.cloud</a> — เราจะตอบกลับภายใน 30 วัน ตามที่กฎหมายกำหนด</>
                    : <>Submit rights requests to <a href="mailto:info@cnccostify.cloud" className="font-bold text-emerald-700 hover:underline">info@cnccostify.cloud</a> — we respond within 30 days as required by law</>}
                </Callout>
              </Section>

              {/* 10. Children */}
              <Section id="children" icon={AlertCircle} title={isTh ? "ผู้เยาว์" : "Minors"}>
                <p>
                  {isTh
                    ? "บริการของเราออกแบบมาสำหรับผู้ใช้งานทางวิชาชีพในอุตสาหกรรม CNC ผู้ใช้งานต้องมีอายุ 18 ปีบริบูรณ์ขึ้นไป — เราไม่ตั้งใจเก็บข้อมูลจากผู้ที่อายุต่ำกว่า 18 ปี"
                    : "Our service is designed for professional use in the CNC industry. Users must be 18 years or older — we do not knowingly collect data from anyone under 18."}
                </p>
                <p>
                  {isTh
                    ? "หากคุณเป็นผู้ปกครองและพบว่าบุตรหลานสมัครใช้งานโดยไม่ได้รับอนุญาต โปรดติดต่อเราเพื่อลบบัญชี"
                    : "If you are a parent and discover your child registered without permission, please contact us for account deletion."}
                </p>
              </Section>

              {/* 11. Changes */}
              <Section id="changes" icon={FileText} title={isTh ? "การเปลี่ยนแปลงนโยบาย" : "Policy Changes"}>
                <p>
                  {isTh
                    ? "เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราวเพื่อให้สอดคล้องกับการเปลี่ยนแปลงของบริการ กฎหมาย หรือเทคโนโลยี"
                    : "We may update this policy periodically to reflect service changes, legal updates, or technology"}
                </p>
                <ul className="space-y-2 mt-3 text-sm">
                  <li className="flex gap-2"><span className="text-blue-500 mt-1">▸</span><span>{isTh ? "การเปลี่ยนแปลงสำคัญจะแจ้งทางอีเมลล่วงหน้า 30 วัน" : "Material changes will be notified via email 30 days in advance"}</span></li>
                  <li className="flex gap-2"><span className="text-blue-500 mt-1">▸</span><span>{isTh ? "การเปลี่ยนแปลงเล็กน้อย (พิมพ์ผิด, จัดรูปแบบ) จะปรับปรุงโดยไม่แจ้ง" : "Minor changes (typos, formatting) update without notice"}</span></li>
                  <li className="flex gap-2"><span className="text-blue-500 mt-1">▸</span><span>{isTh ? "วันที่ปรับปรุงล่าสุดจะแสดงที่ด้านบนของเอกสาร" : "Last-updated date shown at the top of this document"}</span></li>
                </ul>
              </Section>

              {/* 12. Contact */}
              <Section id="contact" icon={Mail} title={isTh ? "ติดต่อ" : "Contact"}>
                <p>
                  {isTh
                    ? "หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิตาม PDPA โปรดติดต่อ:"
                    : "For questions about this Privacy Policy or to exercise your PDPA rights, contact:"}
                </p>
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mt-4">
                  <div className="font-black text-lg mb-3">
                    {isTh ? "บริษัท เจ แนค (ประเทศไทย) จำกัด" : "J Nac (Thailand) Co., Ltd."}
                  </div>
                  <div className="space-y-2 text-sm text-blue-50 mb-5">
                    <div>{isTh ? "เลขที่ 84 หมู่ 2 ซ.สุนทรวิภาค ถ.บางพลี-ตำหรุ" : "84 Moo 2, Soi Soontornvipark, Bangplee-Tamru Rd."}</div>
                    <div>{isTh ? "ต.แพรกษาใหม่ อ.เมือง จ.สมุทรปราการ 10280" : "Praeksamai, Mueang, Samut Prakan 10280, Thailand"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href="mailto:info@cnccostify.cloud" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition text-sm">
                      <Mail size={14} /> info@cnccostify.cloud
                    </a>
                    <a href="tel:0811442000" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white font-bold rounded-lg hover:bg-white/30 transition border border-white/30 text-sm">
                      <Phone size={14} /> 08 1144 2000
                    </a>
                    <Link href={`/${locale}/contact`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white font-bold rounded-lg hover:bg-white/30 transition border border-white/30 text-sm">
                      {isTh ? "หน้าติดต่อ" : "Contact page"} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </Section>

            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ── Reusable building blocks ─────────────────────────────────────── */

function Section({
  id, icon: Icon, title, children,
}: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-md">
          <Icon size={20} className="text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 text-slate-700 leading-relaxed text-sm md:text-base">{children}</div>
    </section>
  );
}

function DataCard({
  icon: Icon, color, title, items,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow`}>
          <Icon size={16} className="text-white" />
        </div>
        <h3 className="font-black text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-1 text-sm text-slate-700 ml-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProviderCard({
  title, badge, color, rows, link,
}: {
  title: string;
  badge: string;
  color: string;
  rows: string[][];
  link: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-slate-900">{title}</h3>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${color} text-white`}>
          {badge}
        </span>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className="border-b border-slate-100 last:border-b-0">
              <td className="py-1.5 font-bold text-slate-500 align-top pr-2">{k}</td>
              <td className="py-1.5 text-slate-700">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 font-bold">
        Privacy Policy <ExternalLink size={11} />
      </a>
    </div>
  );
}

function Callout({
  type, children,
}: {
  type: "tip" | "warn" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    tip:  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: Info,         iconColor: "text-emerald-600" },
    warn: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertCircle,  iconColor: "text-amber-600" },
    info: { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info,         iconColor: "text-blue-600" },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={`flex items-start gap-2.5 ${styles.bg} ${styles.border} ${styles.text} border rounded-xl p-3 text-sm mt-3`}>
      <Icon size={18} className={`${styles.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
