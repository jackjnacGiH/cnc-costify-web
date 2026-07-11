import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BookOpen, Download, LogIn, FileBox, ScanLine, Settings2, Database,
  PaintBucket, Calculator, FileSpreadsheet, MessageSquare, ShieldCheck,
  AlertTriangle, HelpCircle, ArrowRight, Check, Info, Lightbulb, Wrench,
  Key, Mail, Phone, ExternalLink,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTh = locale === "th";

  // ── Table of contents — sections used to render navigation + content ──
  const sections = [
    { id: "install",   label: isTh ? "ติดตั้งโปรแกรม"           : "Installation",         icon: Download },
    { id: "signin",    label: isTh ? "การเข้าสู่ระบบ"            : "Sign In",              icon: LogIn },
    { id: "step",      label: isTh ? "คำนวณจากไฟล์ STEP"        : "STEP File Workflow",   icon: FileBox },
    { id: "pdfjpg",    label: isTh ? "วิเคราะห์ PDF / JPG"       : "PDF/JPG Analysis",     icon: ScanLine },
    { id: "settings",  label: isTh ? "ตั้งค่าราคาและวัสดุ"      : "Pricing Settings",     icon: Settings2 },
    { id: "coating",   label: isTh ? "จัดการ Coating"           : "Coating Management",   icon: PaintBucket },
    { id: "backup",    label: isTh ? "Backup / Restore"          : "Backup / Restore",     icon: Database },
    { id: "excel",     label: isTh ? "Export Excel"              : "Excel Export",         icon: FileSpreadsheet },
    { id: "chat",      label: isTh ? "AI Chat"                   : "AI Chat",              icon: MessageSquare },
    { id: "license",   label: isTh ? "สิทธิ์การใช้งาน"          : "License Management",   icon: ShieldCheck },
    { id: "trouble",   label: isTh ? "แก้ไขปัญหา"               : "Troubleshooting",      icon: AlertTriangle },
    { id: "faq",       label: "FAQ",                              icon: HelpCircle },
  ];

  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-slate-50 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-400/20 via-purple-400/10 to-transparent blur-3xl rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full text-sm font-bold text-blue-800 mb-6">
            <BookOpen size={16} className="text-purple-600" />
            {isTh ? "คู่มือการใช้งาน" : "User Documentation"}
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {isTh ? "คู่มือ " : "Get started with "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CNC Costify AI</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {isTh
              ? "เริ่มต้นใช้งานใน 5 นาที — ครอบคลุมตั้งแต่ติดตั้ง วิเคราะห์ไฟล์ ตั้งค่าราคา จนถึงการแก้ไขปัญหา"
              : "Get up and running in 5 minutes — covers installation, file analysis, pricing setup, and troubleshooting"}
          </p>
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
            <article className="lg:col-span-3 space-y-12">

              {/* 1. Installation */}
              <DocSection id="install" icon={Download} title={isTh ? "ติดตั้งโปรแกรม" : "Installation"}>
                <Steps
                  steps={(isTh
                    ? [
                        { title: "ดาวน์โหลดตัวติดตั้ง", body: <>เข้า <Link href={`/${locale}/download`} className="text-blue-600 hover:underline font-bold">หน้าดาวน์โหลด</Link> → กดปุ่ม &ldquo;ดาวน์โหลด&rdquo; (~635 MB)</> },
                        { title: "Run Installer", body: "ดับเบิลคลิกไฟล์ Setup.exe → เลือก Run as administrator → ทำตามขั้นตอน Wizard ถึง Finish" },
                        { title: "เปิดโปรแกรม", body: "Shortcut บน Desktop / Start Menu → คลิกเปิด — โปรแกรมจะเริ่มที่หน้าต้อนรับ (Activation)" },
                        { title: "เลือกวิธีเข้าใช้งาน", body: "Sign in ผ่านบัญชีเว็บไซต์ (สำหรับ Free / Monthly) หรือ Import license.dat (Yearly / Lifetime)" },
                      ]
                    : [
                        { title: "Download installer", body: <>Go to <Link href={`/${locale}/download`} className="text-blue-600 hover:underline font-bold">Download page</Link> → click &ldquo;Download&rdquo; (~635 MB)</> },
                        { title: "Run installer", body: "Double-click Setup.exe → Run as administrator → follow the Wizard to Finish" },
                        { title: "Launch the app", body: "Desktop / Start Menu shortcut → click to open — app starts on the Activation screen" },
                        { title: "Choose how to access", body: "Sign in via Website (for Free / Monthly) or Import license.dat (Yearly / Lifetime)" },
                      ]) as DocStep[]}
                />
                <Callout type="tip">
                  {isTh
                    ? "ระบบขั้นต่ำ: Windows 10/11 64-bit, RAM 4 GB ขึ้นไป, พื้นที่ว่าง ~2 GB"
                    : "Requirements: Windows 10/11 64-bit, 4 GB+ RAM, ~2 GB free space"}
                </Callout>
              </DocSection>

              {/* 2. Sign in */}
              <DocSection id="signin" icon={LogIn} title={isTh ? "การเข้าสู่ระบบ" : "Sign In"}>
                <p>
                  {isTh
                    ? "CNC Costify AI รองรับการยืนยันตัวตน 2 วิธี — เลือกได้ตามแพ็กเกจที่คุณใช้"
                    : "CNC Costify AI supports two authentication methods — choose based on your plan"}
                </p>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                        <LogIn size={16} className="text-white" />
                      </div>
                      <h3 className="font-black text-slate-900">{isTh ? "เข้าสู่ระบบด้วยบัญชีเว็บ" : "Sign in via Website"}</h3>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      {isTh ? "สำหรับแพ็กเกจ Free + Monthly (ต้องออนไลน์)" : "For Free + Monthly plans (online required)"}
                    </p>
                    <ol className="text-sm space-y-1.5 list-decimal list-inside text-slate-700">
                      <li>{isTh ? "เปิดแอป → แท็บ \"สิทธิ์การใช้งาน\"" : "Open app → \"License\" tab"}</li>
                      <li>{isTh ? "กดปุ่ม \"เข้าสู่ระบบด้วยบัญชีเว็บไซต์\"" : "Click \"Sign in via Website\""}</li>
                      <li>{isTh ? "Browser เปิดหน้าให้ login" : "Browser opens login page"}</li>
                      <li>{isTh ? "ยืนยันสิทธิ์ → กลับมาที่แอป" : "Authorize → return to app"}</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Key size={16} className="text-white" />
                      </div>
                      <h3 className="font-black text-slate-900">{isTh ? "นำเข้า License.dat" : "Import License.dat"}</h3>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      {isTh ? "สำหรับ Yearly + Lifetime (ใช้งาน Offline)" : "For Yearly + Lifetime (offline-capable)"}
                    </p>
                    <ol className="text-sm space-y-1.5 list-decimal list-inside text-slate-700">
                      <li>{isTh ? "ดาวน์โหลด license.dat จากหน้า \"บัญชีของฉัน\"" : "Download license.dat from \"My Account\""}</li>
                      <li>{isTh ? "เปิดแอป → แท็บ \"สิทธิ์การใช้งาน\"" : "Open app → \"License\" tab"}</li>
                      <li>{isTh ? "กด \"นำเข้าสิทธิ์การใช้งาน\" → เลือกไฟล์" : "Click \"Import License\" → pick file"}</li>
                      <li>{isTh ? "ระบบยืนยัน Hardware ID → ใช้งานได้ทันที" : "System verifies Hardware ID → ready to use"}</li>
                    </ol>
                  </div>
                </div>

                <Callout type="warn">
                  {isTh
                    ? "License.dat ผูกกับ Hardware ID ของเครื่องที่สั่งซื้อ ใช้กับเครื่องอื่นไม่ได้ — หากต้องการย้ายเครื่อง ติดต่อ info@cnccostify.cloud"
                    : "License.dat is bound to the Hardware ID at purchase — not transferable. To move machines, contact info@cnccostify.cloud"}
                </Callout>
              </DocSection>

              {/* 3. STEP workflow */}
              <DocSection id="step" icon={FileBox} title={isTh ? "คำนวณจากไฟล์ STEP" : "STEP File Workflow"}>
                <Steps
                  steps={(isTh
                    ? [
                        { title: "อัปโหลด STEP", body: "ที่แท็บ \"หน้าหลัก\" กดปุ่ม \"อัปโหลด\" หรือลากไฟล์ .step/.stp เข้ามา — ระบบใช้ OpenCASCADE คำนวณปริมาตรอัตโนมัติ" },
                        { title: "ตรวจ Stock Size", body: "ระบบจะแนะนำ Stock Size (Box หรือ Cylinder) — แก้ไขได้ที่ช่อง \"ขนาด Stock Mat\"" },
                        { title: "เลือกวัสดุ + Precision", body: "เลือกวัสดุจาก dropdown → ระบบดึงราคาและ Multiplier มาให้ → ตั้ง Precision Base (1-20)" },
                        { title: "เพิ่มต้นทุนอื่น", body: "เลือก Coating, Surface (ผิวเจียร / ยิงทราย), Wire Cut หากต้องการ" },
                        { title: "กดคำนวณราคา", body: "ระบบคำนวณราคา / ชิ้น พร้อมแสดงต้นทุนแยกแต่ละส่วน — ใช้ปุ่ม Round up เพิ่มทีละ 50 บาทได้" },
                        { title: "บันทึก", body: "กดปุ่ม \"บันทึกข้อมูล\" → ผลลัพธ์เข้าไฟล์ Excel ทันที" },
                      ]
                    : [
                        { title: "Upload STEP", body: "On \"Home\" tab → click Upload or drag .step/.stp — OpenCASCADE auto-computes volume" },
                        { title: "Check Stock Size", body: "System suggests Stock Size (Box/Cylinder) — editable in \"Stock Mat Size\" field" },
                        { title: "Pick material + precision", body: "Choose material from dropdown → price + multiplier auto-loaded → set Precision Base (1-20)" },
                        { title: "Add other costs", body: "Pick Coating, Surface (grinding/sandblast), Wire Cut as needed" },
                        { title: "Calculate price", body: "System computes price / part with cost breakdown — use Round up buttons to add 50 THB margin" },
                        { title: "Save", body: "Click \"Save\" → result drops into your Excel file instantly" },
                      ]) as DocStep[]}
                />
              </DocSection>

              {/* 4. PDF/JPG */}
              <DocSection id="pdfjpg" icon={ScanLine} title={isTh ? "วิเคราะห์ PDF / JPG" : "PDF/JPG Analysis"}>
                <p>
                  {isTh
                    ? "แท็บ PDF/JPG ออกแบบมาสำหรับการคำนวณราคาเป็นชุด (Batch) — อัปโหลดหลายไฟล์พร้อมกัน ให้ AI วิเคราะห์แล้วแก้ไขผลลัพธ์ก่อน Export"
                    : "The PDF/JPG tab is designed for batch quoting — upload many files at once, let AI analyze, then edit results before export"}
                </p>
                <Steps
                  steps={(isTh
                    ? [
                        { title: "เปิดแท็บ PDF/JPG", body: "คลิก \"PDF/JPG\" ที่แถบเมนูด้านบน" },
                        { title: "อัปโหลดไฟล์", body: "ลากไฟล์ PDF/JPG/PNG หลายไฟล์ (สูงสุดประมาณ 20 ไฟล์ต่อรอบ) — ตามแพ็กเกจของคุณ" },
                        { title: "เริ่มประมวลผล", body: "กดปุ่ม \"ประมวลผล\" → AI วิเคราะห์ดึง Material, Stock, Coating, Part No, Drawing No" },
                        { title: "ตรวจสอบและแก้ไข", body: "ในตาราง: แก้ Material, Stock Size, QTY, Coating, Precision Base (PB) ต่อแถวได้" },
                        { title: "Export Excel", body: "กด \"EXPORT EXCEL\" — บันทึกผลลัพธ์ทั้งหมดลง Costify Data.xlsx" },
                      ]
                    : [
                        { title: "Open PDF/JPG tab", body: "Click \"PDF/JPG\" in the top menu" },
                        { title: "Upload files", body: "Drag PDF/JPG/PNG files (up to ~20 per round depending on plan)" },
                        { title: "Start processing", body: "Click \"Process\" → AI extracts Material, Stock, Coating, Part No, Drawing No" },
                        { title: "Review & edit", body: "In the table: edit Material, Stock Size, QTY, Coating, Precision Base (PB) per row" },
                        { title: "Export Excel", body: "Click \"EXPORT EXCEL\" — saves all results into Costify Data.xlsx" },
                      ]) as DocStep[]}
                />
                <Callout type="tip">
                  {isTh
                    ? "PB ตั้งต่อแถวได้ — กรอบสี indigo บอกว่าแถวนั้น override จากค่า default"
                    : "PB is per-row — indigo border indicates a row overrides the default value"}
                </Callout>
              </DocSection>

              {/* 5. Settings */}
              <DocSection id="settings" icon={Settings2} title={isTh ? "ตั้งค่าราคาและวัสดุ" : "Pricing Settings"}>
                <p>
                  {isTh ? "แท็บ \"ตั้งค่า\" รวมการตั้งค่าราคาทุกชนิดไว้ในที่เดียว" : "The \"Settings\" tab gathers all pricing config in one place"}
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {(isTh
                    ? [
                        { icon: Database, title: "ฐานข้อมูลวัสดุ",   desc: "Density + ราคา/kg หรือ /mm² + กลุ่มความยาก" },
                        { icon: PaintBucket, title: "ราคา Coating",  desc: "เพิ่ม/แก้ไข/ลบ coating + ราคาต่อ in² หรือ kg" },
                        { icon: Wrench, title: "ราคากระบวนการ",      desc: "Surface (เจียร/ยิงทราย) + Wire Cut" },
                        { icon: Calculator, title: "ราคาเริ่มต้น",   desc: "Starting price ของ Material, Coating, CNC, CNC Setup" },
                      ]
                    : [
                        { icon: Database, title: "Material Database", desc: "Density + price /kg or /mm² + difficulty group" },
                        { icon: PaintBucket, title: "Coating Prices", desc: "Add/edit/delete coatings + price /in² or /kg" },
                        { icon: Wrench, title: "Process Prices",      desc: "Surface (grinding/sandblast) + Wire Cut" },
                        { icon: Calculator, title: "Start Prices",    desc: "Starting price for Material, Coating, CNC, CNC Setup" },
                      ]
                  ).map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-slate-900">{title}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DocSection>

              {/* 6. Coating */}
              <DocSection id="coating" icon={PaintBucket} title={isTh ? "จัดการ Coating" : "Coating Management"}>
                <p>
                  {isTh
                    ? "หน้า \"ตั้งราคา Coating\" รองรับการ เพิ่ม / แก้ไข / ลบ รายการ Coating พร้อมตั้งราคา"
                    : "The \"Coating Prices\" panel supports add / edit / delete with pricing"}
                </p>
                <ul className="space-y-2 mt-3 text-sm">
                  <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span><b>{isTh ? "➕ เพิ่ม:" : "➕ Add:"}</b> {isTh ? "กดปุ่ม → ใส่ชื่อ Coating ใหม่ → ตั้งราคา/หน่วย → บันทึก" : "Click → enter new coating name → set price/unit → save"}</span></li>
                  <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span><b>{isTh ? "✏️ แก้ไข:" : "✏️ Edit:"}</b> {isTh ? "เลือก coating → กดปุ่ม → แก้ชื่อ → ราคาเดิม migrate อัตโนมัติ" : "Select coating → click → rename → existing price auto-migrates"}</span></li>
                  <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span><b>{isTh ? "🗑️ ลบ:" : "🗑️ Delete:"}</b> {isTh ? "เลือก coating → กดปุ่ม → ยืนยัน → ลบทั้งจาก list และ price" : "Select coating → click → confirm → removes from list & prices"}</span></li>
                </ul>
                <Callout type="info">
                  {isTh
                    ? "Coating list sync กับหน้า PDF/JPG ทันที — ไม่ต้องโหลดแอปใหม่"
                    : "Coating list syncs with PDF/JPG page instantly — no app restart needed"}
                </Callout>
              </DocSection>

              {/* 7. Backup / Restore */}
              <DocSection id="backup" icon={Database} title="Backup / Restore">
                <p>
                  {isTh
                    ? "แท็บ \"ตั้งค่า\" → \"สำรอง / กู้คืนข้อมูล\" บันทึกการตั้งค่าทั้งหมดเป็นไฟล์ JSON เพื่อย้ายเครื่องหรือแชร์กับทีม"
                    : "Settings tab → \"Backup / Restore\" exports all settings as a JSON file — for transferring or team sharing"}
                </p>
                <div className="bg-slate-900 rounded-xl p-4 mt-3 text-xs font-mono text-slate-200 overflow-x-auto">
                  <div className="text-emerald-400 mb-1">// {isTh ? "ข้อมูลที่บันทึก" : "Included in backup:"}</div>
                  <div>materialGroups · materialDensities · materialPrices</div>
                  <div>coatingPrices · coatingList · processPrices · startPrices</div>
                </div>
                <Callout type="warn">
                  {isTh
                    ? "Restore จะเขียนทับการตั้งค่าปัจจุบันทั้งหมด — แนะนำให้ Backup ก่อนเสมอ"
                    : "Restore overwrites all current settings — always backup first"}
                </Callout>
              </DocSection>

              {/* 8. Excel */}
              <DocSection id="excel" icon={FileSpreadsheet} title="Excel Export">
                <Steps
                  steps={(isTh
                    ? [
                        { title: "ตั้ง Path ไฟล์ Excel", body: "ที่ \"ตั้งค่า\" → \"ตั้งค่าไฟล์บันทึก Excel\" → เลือกตำแหน่งไฟล์ (เช่น D:\\Costify Data.xlsx)" },
                        { title: "บันทึกจากหน้าหลัก", body: "หลังคำนวณ → กดปุ่ม \"บันทึกข้อมูล\" → ระบบเขียนผลลัพธ์ลง Sheet ของวันนั้น" },
                        { title: "Export จาก PDF/JPG", body: "หลัง batch analysis → ปุ่ม \"EXPORT EXCEL\" → บันทึกทั้งตารางในครั้งเดียว" },
                      ]
                    : [
                        { title: "Set Excel file path", body: "Settings → \"Excel file path\" → choose location (e.g., D:\\Costify Data.xlsx)" },
                        { title: "Save from main page", body: "After calc → click \"Save\" → writes result to today's sheet" },
                        { title: "Export from PDF/JPG", body: "After batch analysis → \"EXPORT EXCEL\" button → saves whole table at once" },
                      ]) as DocStep[]}
                />
              </DocSection>

              {/* 9. AI Chat */}
              <DocSection id="chat" icon={MessageSquare} title="AI Chat">
                <p>
                  {isTh
                    ? "แท็บ \"แชท AI\" ให้คุณถามคำถามเกี่ยวกับวัสดุ การตัดเฉือน Tolerance ฯลฯ"
                    : "The \"AI Chat\" tab lets you ask anything about materials, machining, tolerances, etc."}
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-3">
                  <div className="text-xs font-black text-blue-700 uppercase mb-2">{isTh ? "ตัวอย่างคำถาม" : "Example questions"}</div>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• {isTh ? "Density ของ SS400 เทียบกับ S45C ต่างกันแค่ไหน?" : "How does density of SS400 differ from S45C?"}</li>
                    <li>• {isTh ? "ชิ้นงานต้องการ HRc 60 ควรใช้วัสดุอะไร?" : "For HRc 60 hardness, what material should I use?"}</li>
                    <li>• {isTh ? "Hard Chrome กับ Flat Chrome ต่างกันยังไง?" : "Hard Chrome vs Flat Chrome — what's the difference?"}</li>
                    <li>• {isTh ? "Tolerance H7 หมายความว่าอะไร?" : "What does Tolerance H7 mean?"}</li>
                  </ul>
                </div>
              </DocSection>

              {/* 10. License */}
              <DocSection id="license" icon={ShieldCheck} title={isTh ? "สิทธิ์การใช้งาน" : "License Management"}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "แพ็กเกจ" : "Plan"}</th>
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "ไฟล์/วัน" : "Files/day"}</th>
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "ออนไลน์?" : "Online?"}</th>
                        <th className="px-3 py-2 text-left font-black text-slate-700">{isTh ? "อายุ" : "Validity"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { plan: "Free",     files: "3",                          online: isTh ? "ต้องออนไลน์" : "Required",  validity: isTh ? "ตลอดชีพ" : "Lifetime" },
                        { plan: "Monthly",  files: "30",                         online: isTh ? "ต้องออนไลน์" : "Required",  validity: "30 " + (isTh ? "วัน" : "days") },
                        { plan: "Yearly",   files: isTh ? "ไม่จำกัด" : "Unlimited", online: isTh ? "ออฟไลน์ได้ (.dat)" : "Offline OK (.dat)", validity: "455 " + (isTh ? "วัน" : "days") },
                        { plan: "Lifetime", files: isTh ? "ไม่จำกัด" : "Unlimited", online: isTh ? "ออฟไลน์ได้ (.dat)" : "Offline OK (.dat)", validity: isTh ? "ตลอดชีพ" : "Lifetime" },
                      ].map(({ plan, files, online, validity }, i) => (
                        <tr key={plan} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-3 py-2 font-bold text-slate-900">{plan}</td>
                          <td className="px-3 py-2 text-slate-700">{files}</td>
                          <td className="px-3 py-2 text-slate-700">{online}</td>
                          <td className="px-3 py-2 text-slate-700">{validity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Callout type="tip">
                  {isTh
                    ? "ดู Hardware ID ได้ที่แท็บ \"สิทธิ์การใช้งาน\" → ปุ่ม \"คัดลอก\" — ใช้ตอนสั่งซื้อ Yearly / Lifetime"
                    : "View your Hardware ID in \"License\" tab → \"Copy\" button — needed when ordering Yearly / Lifetime"}
                </Callout>
              </DocSection>

              {/* 11. Troubleshooting */}
              <DocSection id="trouble" icon={AlertTriangle} title={isTh ? "แก้ไขปัญหา" : "Troubleshooting"}>
                <div className="space-y-3">
                  {(isTh
                    ? [
                        { q: "กดคำนวณราคาแล้วขึ้น 'ยืนยันสิทธิ์'", a: "Free plan ต้อง Sign in ก่อน — ไปแท็บ \"สิทธิ์การใช้งาน\" → \"เข้าสู่ระบบด้วยบัญชีเว็บไซต์\"" },
                        { q: "Import license.dat แล้วขึ้น 'ข้อผิดพลาดที่ไม่รู้จัก'", a: "ตรวจสอบว่าใช้ V5.5+ แล้ว — V5.4 ไม่รองรับ admin-key-2026 ดาวน์โหลดเวอร์ชันล่าสุดจากเว็บไซต์" },
                        { q: "STEP file วิเคราะห์ไม่ได้", a: "ตรวจสอบว่าไฟล์เปิดได้ด้วย CAD อื่น — บางครั้งไฟล์ corrupt แนะนำให้ Export ใหม่จาก CAD" },
                        { q: "AI ตอบช้าหรือไม่ตอบ", a: "Gemini อาจ quota เต็ม — ระบบจะ fallback ไป OpenRouter อัตโนมัติ ถ้ายังไม่ทำงานให้ตรวจสอบเน็ต" },
                        { q: "Excel Export ไม่ได้", a: "ตรวจสอบว่าไฟล์ปลายทางไม่ได้ถูกเปิดอยู่ใน Excel — ปิดก่อนแล้ว Export ใหม่" },
                      ]
                    : [
                        { q: "Calculate prompts for license", a: "Free plan needs sign-in first — go to \"License\" tab → \"Sign in via Website\"" },
                        { q: "license.dat import shows 'Unknown error'", a: "Make sure you're on V5.5+ — V5.4 doesn't support admin-key-2026. Download the latest from the website" },
                        { q: "STEP file analysis fails", a: "Check file opens in another CAD app — sometimes files corrupt. Re-export from CAD" },
                        { q: "AI slow or unresponsive", a: "Gemini quota may be exhausted — system auto-fallbacks to OpenRouter. If still down, check internet" },
                        { q: "Excel Export fails", a: "Target file may be open in Excel — close it then re-export" },
                      ]
                  ).map(({ q, a }, i) => (
                    <details key={i} className="bg-slate-50 rounded-xl border border-slate-200 group">
                      <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors rounded-xl">
                        <span>❓ {q}</span>
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">{a}</div>
                    </details>
                  ))}
                </div>
              </DocSection>

              {/* 12. FAQ */}
              <DocSection id="faq" icon={HelpCircle} title="FAQ">
                <div className="space-y-3">
                  {(isTh
                    ? [
                        { q: "ข้อมูลของฉันส่งไปไหนบ้าง?", a: "ไฟล์ STEP / PDF / JPG ไม่ออกจากเครื่องคุณ — เฉพาะ Prompt ที่ส่งให้ AI วิเคราะห์เท่านั้นที่เดินทางไป Cloud" },
                        { q: "ย้ายเครื่องได้ไหม?", a: "Yearly / Lifetime ผูกกับ Hardware ID หากต้องการย้าย ติดต่อ info@cnccostify.cloud เพื่อขอ re-issue license" },
                        { q: "ใช้งานร่วมกับเครื่องอื่นได้ไหม?", a: "1 License = 1 เครื่อง หากต้องการหลายเครื่อง ซื้อเพิ่มหรือสมัครแพ็กเกจ Team (ติดต่อเรา)" },
                        { q: "อัปเดตฟรีไหม?", a: "Free สำหรับ Minor updates ภายในเวอร์ชันใหญ่เดียวกัน (เช่น V5.0 → V5.13) — Major version ใหม่อาจมีค่าใช้จ่าย" },
                        { q: "ยกเลิกแพ็กเกจได้ไหม?", a: "Monthly ยกเลิกได้ทุกเดือน — Yearly และ Lifetime ไม่มีการคืนเงินแต่ใช้งานจนหมดอายุได้" },
                        { q: "ใช้งาน Mac / Linux ได้ไหม?", a: "ปัจจุบันรองรับเฉพาะ Windows 10/11 64-bit — เวอร์ชัน Mac กำลังพิจารณาตาม Demand" },
                      ]
                    : [
                        { q: "Where does my data go?", a: "STEP/PDF/JPG files stay on your machine — only the prompt text sent to AI for analysis travels to the cloud" },
                        { q: "Can I move machines?", a: "Yearly/Lifetime are bound to Hardware ID. To move, contact info@cnccostify.cloud to re-issue the license" },
                        { q: "Can I share with another machine?", a: "1 License = 1 machine. For multiple machines, buy additional licenses or contact us for a Team plan" },
                        { q: "Are updates free?", a: "Free for minor updates within the same major version (e.g., V5.0 → V5.13). New major versions may incur a fee" },
                        { q: "Can I cancel?", a: "Monthly: cancel any month. Yearly/Lifetime: no refunds but usable until expiry" },
                        { q: "Mac / Linux support?", a: "Currently Windows 10/11 64-bit only — Mac version being considered based on demand" },
                      ]
                  ).map(({ q, a }, i) => (
                    <details key={i} className="bg-white rounded-xl border border-slate-200 group">
                      <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-xl">
                        <span>❓ {q}</span>
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">{a}</div>
                    </details>
                  ))}
                </div>
              </DocSection>

              {/* Contact CTA */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white shadow-xl">
                <h3 className="text-2xl font-black mb-2">
                  {isTh ? "ยังไม่เจอคำตอบ?" : "Still need help?"}
                </h3>
                <p className="text-blue-100 mb-5">
                  {isTh ? "ทีมงานพร้อมตอบทุกคำถาม — ภายใน 24 ชั่วโมง" : "Our team responds to every inquiry within 24 hours"}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="mailto:info@cnccostify.cloud" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition">
                    <Mail size={16} /> info@cnccostify.cloud
                  </a>
                  <a href="tel:0811442000" className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white font-bold rounded-lg hover:bg-white/30 transition border border-white/30">
                    <Phone size={16} /> 08 1144 2000
                  </a>
                  <Link href={`/${locale}/contact`} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white font-bold rounded-lg hover:bg-white/30 transition border border-white/30">
                    {isTh ? "หน้าติดต่อ" : "Contact page"} <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ── Reusable building blocks ─────────────────────────────────────── */

function DocSection({
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
          <Icon size={20} className="text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

type DocStep = { title: string; body: React.ReactNode };

function Steps({ steps }: { steps: DocStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-black text-xs flex items-center justify-center mt-0.5 shadow">
            {i + 1}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm md:text-base mb-0.5">{step.title}</div>
            <div className="text-sm text-slate-600">{step.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Callout({
  type, children,
}: {
  type: "tip" | "warn" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    tip:  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: Lightbulb,    iconColor: "text-emerald-600" },
    warn: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   icon: AlertTriangle, iconColor: "text-amber-600" },
    info: { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800",    icon: Info,          iconColor: "text-blue-600" },
  }[type];
  const Icon = styles.icon;
  return (
    <div className={`flex items-start gap-2.5 ${styles.bg} ${styles.border} ${styles.text} border rounded-xl p-3 text-sm mt-3`}>
      <Icon size={18} className={`${styles.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
