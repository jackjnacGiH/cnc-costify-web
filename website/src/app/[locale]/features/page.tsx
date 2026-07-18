import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Sparkles, FileBox, ScanLine, Calculator, FileSpreadsheet, Brain, MessageSquare,
  Database, Zap, Shield, Cpu, Globe, Languages, Cloud, Lock, Settings2,
  Layers, Download, RefreshCw, Award, ArrowRight, Check, Wrench,
  PaintBucket, Ruler, Clock, Server,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTh = locale === "th";

  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="site-hero pt-16 pb-20 md:pt-24 md:pb-24">
        <div className="site-hero-orb" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="site-eyebrow mb-8">
            <Sparkles size={16} className="text-fuchsia-300" />
            {isTh ? "ฟีเจอร์ทั้งหมด" : "All Features"}
          </div>

          <h1 className="site-hero-title text-4xl md:text-6xl font-black tracking-tight mb-6">
            {isTh ? "ครบทุกเครื่องมือ " : "Everything you need to "}
            <span className="site-hero-highlight">
              {isTh ? "คำนวณราคา CNC" : "quote CNC parts"}
            </span>
            <br />
            {isTh ? "ในซอฟต์แวร์เดียว" : "in one tool"}
          </h1>

          <p className="site-hero-copy text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {isTh
              ? "ตั้งแต่อ่านไฟล์ STEP/PDF/JPG ไปจนถึง Export Excel — ทุกขั้นตอนทำงานใน CNC Costify AI"
              : "From STEP/PDF/JPG analysis to Excel export — every step happens inside CNC Costify AI"}
          </p>
        </div>
      </section>

      {/* ── Category 1: Input ──────────────────────────────────── */}
      <FeatureSection
        eyebrow={isTh ? "การรับข้อมูลแบบงาน" : "Input Methods"}
        title={isTh ? "อัปโหลดได้ทุกรูปแบบไฟล์" : "Accept any drawing format"}
        accentFrom="from-blue-500"
        accentTo="to-cyan-500"
        items={[
          {
            icon: FileBox,
            title: isTh ? "วิเคราะห์ไฟล์ STEP อัตโนมัติ" : "Automated STEP Analysis",
            desc: isTh
              ? "ลากไฟล์ .step / .stp เข้ามา → ระบบใช้ OpenCASCADE คำนวณปริมาตรชิ้นงานและขนาด Stock อัตโนมัติ"
              : "Drag in .step/.stp → OpenCASCADE engine computes volume and stock size automatically",
            bullets: isTh
              ? ["ปริมาตรแม่นยำระดับวิศวกรรม", "Stock Size เลือก Box หรือ Cylinder ได้", "รองรับไฟล์ขนาดใหญ่ (Solid + Assembly)"]
              : ["Engineering-grade volume accuracy", "Box or Cylinder stock detection", "Handles large files (Solid + Assembly)"],
          },
          {
            icon: ScanLine,
            title: isTh ? "AI อ่านแบบงาน PDF / JPG" : "AI PDF/JPG Drawing Reader",
            desc: isTh
              ? "อัปโหลดแบบงานทีละหลายไฟล์ — AI ดึง Material, Stock Size, Coating, Part No, Drawing No, Tolerance ออกมาให้พร้อมแก้ไขได้"
              : "Upload many drawings at once — AI extracts Material, Stock Size, Coating, Part No, Drawing No, Tolerance (all editable)",
            bullets: isTh
              ? ["Batch upload หลายสิบไฟล์ในครั้งเดียว", "ดึง Part No / Drawing No อัตโนมัติ", "แก้ไขค่าที่ AI เดาผิดได้ทุกฟิลด์"]
              : ["Batch upload dozens of files at once", "Auto-extract Part No / Drawing No", "Edit any AI-guessed value"],
          },
          {
            icon: Settings2,
            title: isTh ? "กรอกแบบ Manual ได้ตลอด" : "Manual Entry Always Available",
            desc: isTh
              ? "ไม่อยากใช้ AI? พิมพ์ Material และ Stock Size เองได้ ใช้งานได้รวดเร็วเหมือนเครื่องคิดเลข"
              : "Don't want AI? Type material and stock size manually — works as fast as a calculator",
            bullets: isTh
              ? ["ใช้กับงาน Repeat Order ได้สะดวก", "ไม่ต้องพึ่งอินเทอร์เน็ตในกรณี Manual", "เก็บเป็น Template ได้"]
              : ["Convenient for repeat orders", "No internet needed for manual mode", "Save as templates"],
          },
        ]}
      />

      {/* ── Category 2: Pricing engine ─────────────────────────── */}
      <FeatureSection
        bg="bg-slate-50"
        eyebrow={isTh ? "เครื่องคำนวณต้นทุน" : "Pricing Engine"}
        title={isTh ? "สูตรการคำนวณระดับวิศวกรอาวุโส" : "Senior-engineer pricing logic"}
        accentFrom="from-emerald-500"
        accentTo="to-teal-500"
        items={[
          {
            icon: Calculator,
            title: isTh ? "คำนวณครบทุกต้นทุน" : "All Cost Components Covered",
            desc: isTh
              ? "Material + CNC Process + CNC Setup + Coating + Surface + Wire Cut คำนวณตามสูตรที่ปรับได้ตามนโยบายราคาของบริษัทคุณ"
              : "Material + CNC Process + CNC Setup + Coating + Surface + Wire Cut — formulas adjustable to your company's pricing policy",
            bullets: isTh
              ? ["Setup Cost คิดแบบ amortized ต่อจำนวนชิ้น", "ปัดเศษขึ้นใกล้สุด 10 บาททุก subtotal", "ปุ่ม Round up เพิ่มทีละ 50 บาทในกรณีต้องการบวก margin"]
              : ["Setup Cost amortized over quantity", "Auto round-up to nearest 10 THB per subtotal", "Round-up button to add 50 THB margin steps"],
          },
          {
            icon: Layers,
            title: isTh ? "Precision Base 1-20 ระดับ" : "20-Level Precision Base",
            desc: isTh
              ? "ปรับ Multiplier ตามระดับความละเอียดของชิ้นงาน (×1.0 ถึง ×3.0) — งานปกติใช้ ×1.0, งานความละเอียดสูงใช้ ×2.0+"
              : "Adjust multiplier by part precision (×1.0 to ×3.0) — standard parts use ×1.0, high-precision use ×2.0+",
            bullets: isTh
              ? ["ตั้งค่า Default Precision Base ได้", "ปรับเฉพาะแถวต่อชิ้นงานในหน้า PDF/JPG", "Multiplier โปร่งใส คำนวณตามสูตรที่ระบุ"]
              : ["Set default Precision Base", "Per-row override on PDF/JPG page", "Transparent multiplier — formula-based"],
          },
          {
            icon: Database,
            title: isTh ? "ฐานข้อมูลวัสดุ 100+ รายการ" : "100+ Material Database",
            desc: isTh
              ? "Pre-loaded ตั้งแต่เหล็กก่อสร้าง สแตนเลส อลูมิเนียม ทองเหลือง พลาสติก พร้อม Density และราคามาตรฐาน — แก้ไขเพิ่มเองได้"
              : "Pre-loaded with steel, stainless, aluminum, brass, plastics — including density and standard pricing — fully editable",
            bullets: isTh
              ? ["จัดกลุ่ม Easy / Medium / Hard / Very Hard / Extremely Hard", "บันทึก/Restore Backup การตั้งค่าได้", "เพิ่มวัสดุใหม่ได้ไม่จำกัด"]
              : ["Grouped Easy / Medium / Hard / Very Hard / Extremely Hard", "Backup/Restore settings", "Add unlimited custom materials"],
          },
          {
            icon: PaintBucket,
            title: isTh ? "Coating CRUD แบบเต็มรูปแบบ" : "Full Coating CRUD",
            desc: isTh
              ? "เพิ่ม / แก้ไข / ลบ รายการ Coating ได้เอง พร้อมตั้งราคาต่อตารางนิ้วหรือต่อกิโลกรัม"
              : "Add / edit / delete coating items with pricing per sq.inch or per kg",
            bullets: isTh
              ? ["รวมถึง Anodize, Hard Chrome, Zinc, Painting, Hardening", "เปลี่ยนชื่อ migrate ราคาเดิมอัตโนมัติ", "Sync กับหน้า PDF/JPG ทันที"]
              : ["Includes Anodize, Hard Chrome, Zinc, Painting, Hardening", "Rename auto-migrates existing prices", "Real-time sync with PDF/JPG page"],
          },
        ]}
      />

      {/* ── Category 3: AI ─────────────────────────────────────── */}
      <FeatureSection
        eyebrow={isTh ? "ปัญญาประดิษฐ์" : "AI Capabilities"}
        title={isTh ? "AI หลากหลายตัว ทำงานสำรองให้กัน" : "Multi-AI engines with auto-fallback"}
        accentFrom="from-purple-500"
        accentTo="to-pink-500"
        items={[
          {
            icon: Brain,
            title: isTh ? "Multi-AI Engine" : "Multi-AI Engine",
            desc: isTh
              ? "Gemini เป็นหลัก + OpenRouter (Qwen, GLM-4.5, Claude, Llama) เป็น fallback อัตโนมัติ ไม่มีวันที่ AI ใช้ไม่ได้"
              : "Gemini as primary + OpenRouter (Qwen, GLM-4.5, Claude, Llama) as auto-fallback — never down",
            bullets: isTh
              ? ["Auto-rotate เมื่อ Quota ของ Gemini เต็ม", "เลือก Model ได้เองจาก dropdown", "แสดง Token cost ต่อไฟล์ใน UI"]
              : ["Auto-rotate when Gemini quota hits", "Choose model from dropdown", "Per-file token cost shown in UI"],
          },
          {
            icon: MessageSquare,
            title: isTh ? "AI Chat ปรึกษาวัสดุ" : "AI Material Chat",
            desc: isTh
              ? "ถามได้ทุกอย่างเกี่ยวกับ CNC: Density, Spec วัสดุ, การชุบแข็ง, Tolerance, Welding, การทดสอบ ฯลฯ — ตอบใน 2 วินาที"
              : "Ask anything CNC: density, material spec, hardening, tolerance, welding, testing — answers in 2 seconds",
            bullets: isTh
              ? ["รองรับภาษาไทย/อังกฤษ", "ใช้ AI เดียวกันที่วิเคราะห์แบบ", "ไม่จำกัดคำถามสำหรับแพ็กเกจ Yearly+"]
              : ["Thai/English supported", "Same AI as drawing analysis", "Unlimited questions for Yearly+ plans"],
          },
          {
            icon: Cpu,
            title: isTh ? "Engine แสดงผลโปร่งใส" : "Transparent Engine Display",
            desc: isTh
              ? "แต่ละไฟล์แสดง Badge ว่าใช้ AI ตัวไหนวิเคราะห์ พร้อมต้นทุน Token เป็นบาท ตรวจสอบได้ทุกครั้ง"
              : "Each file shows a badge of which AI processed it, plus token cost in THB — fully auditable",
            bullets: isTh
              ? ["แยก Gemini / OpenRouter ชัดเจน", "บอก model ที่ใช้จริง", "บอกจำนวน token ใน/ออก"]
              : ["Gemini / OpenRouter clearly labeled", "Shows actual model used", "Token in/out counts"],
          },
        ]}
      />

      {/* ── Category 4: Output & Integration ───────────────────── */}
      <FeatureSection
        bg="bg-slate-50"
        eyebrow={isTh ? "การส่งออกและเชื่อมต่อ" : "Output & Integration"}
        title={isTh ? "ส่งต่องานได้ทันที" : "Hand off your work instantly"}
        accentFrom="from-amber-500"
        accentTo="to-orange-500"
        items={[
          {
            icon: FileSpreadsheet,
            title: isTh ? "Export Excel พร้อมใช้งานจริง" : "Production-Ready Excel Export",
            desc: isTh
              ? "บันทึกผลทุกการคำนวณลงไฟล์ Excel ของคุณ — Format สวยงาม, Sheet แยกตามวัน, ยอดรวมไฮไลต์, มี Part No / Drawing No"
              : "Save every calculation to your Excel file — formatted layout, daily sheets, totals highlighted, includes Part No / Drawing No",
            bullets: isTh
              ? ["เลือก path ไฟล์ Excel ปลายทางได้", "Export ใบปัจจุบัน หรือทั้งหมด", "Header/Footer ปรับได้ตาม Template บริษัท"]
              : ["Pick destination Excel file path", "Export current quote or all", "Adjustable header/footer template"],
          },
          {
            icon: Download,
            title: isTh ? "บันทึก / กู้คืนการตั้งค่า" : "Backup / Restore Settings",
            desc: isTh
              ? "Backup ตั้งค่าทั้งหมด (Material, Coating, Process Prices, Start Prices) เป็นไฟล์ JSON — ย้ายเครื่องหรือแชร์กับทีมได้"
              : "Backup all settings (Material, Coating, Process, Start Prices) as JSON — move between machines or share with team",
            bullets: isTh
              ? ["ไฟล์ JSON มาตรฐาน อ่านได้", "Restore ทับของเดิมได้ทันที", "ไม่ต้องตั้งค่าใหม่ตอน install เครื่องใหม่"]
              : ["Standard readable JSON", "Restore overrides existing instantly", "No re-setup on new machine"],
          },
        ]}
      />

      {/* ── Category 5: Platform / Security ───────────────────── */}
      <FeatureSection
        eyebrow={isTh ? "แพลตฟอร์มและความปลอดภัย" : "Platform & Security"}
        title={isTh ? "ติดตั้งบนเครื่องคุณ ข้อมูลปลอดภัย" : "Installed locally, your data stays private"}
        accentFrom="from-slate-700"
        accentTo="to-slate-900"
        items={[
          {
            icon: Lock,
            title: isTh ? "Desktop App ทำงาน Local" : "Local Desktop Application",
            desc: isTh
              ? "ติดตั้งบน Windows ของคุณ ไฟล์แบบงานไม่ออกจากเครื่อง (เฉพาะข้อความที่ส่งให้ AI วิเคราะห์เท่านั้น)"
              : "Installed on your Windows machine — drawings stay on your machine (only the prompt text is sent to AI)",
            bullets: isTh
              ? ["ไม่ต้อง Upload ไฟล์ขึ้น cloud ของเรา", "ใช้งาน Offline ได้สำหรับฟีเจอร์ Manual", "Hardware ID Binding ป้องกัน License รั่วไหล"]
              : ["No file upload to our cloud", "Offline mode for manual features", "Hardware ID binding prevents license leaks"],
          },
          {
            icon: Shield,
            title: isTh ? "ระบบ License Ed25519" : "Ed25519 License System",
            desc: isTh
              ? "License signed ด้วย Ed25519 cryptography — ตรวจสอบได้แบบ offline ไม่ต้องเช็ค server ทุกครั้ง"
              : "License signed with Ed25519 cryptography — verified offline, no server check every time",
            bullets: isTh
              ? ["1 License = 1 เครื่อง (ป้องกันแชร์)", "Grace period 14 วัน หากระบบมีปัญหา", "ไม่ค้างทำงานหากเน็ตขาด"]
              : ["1 License = 1 machine (anti-share)", "14-day grace period for issues", "Doesn't freeze when offline"],
          },
          {
            icon: Languages,
            title: isTh ? "รองรับ 2 ภาษา (TH/EN)" : "Bilingual (Thai/English)",
            desc: isTh
              ? "สลับ TH ↔ EN ได้ทันทีในแอปและเว็บไซต์ — ทุก label, error message, ผลลัพธ์การคำนวณ"
              : "Switch TH ↔ EN instantly in app & website — every label, error, calculation result",
            bullets: isTh
              ? ["บันทึกภาษาที่เลือกไว้", "AI Chat ตอบในภาษาที่ถาม", "Excel Export ใช้ภาษาที่เลือก"]
              : ["Remembers your language choice", "AI Chat replies in your language", "Excel export uses chosen language"],
          },
          {
            icon: RefreshCw,
            title: isTh ? "อัปเดตอัตโนมัติ" : "Automatic Updates",
            desc: isTh
              ? "ดาวน์โหลดเวอร์ชันใหม่ได้ตลอดเวลา — หาก Bug fix หรือฟีเจอร์ใหม่ถูกพัฒนา เราจะแจ้งคุณผ่านอีเมล"
              : "Download new versions any time — bug fixes or new features ship via email notification",
            bullets: isTh
              ? ["Free upgrade ภายในเวอร์ชันใหญ่เดียวกัน", "Changelog แจ้งทุกการเปลี่ยนแปลง", "ไม่บังคับอัปเดต ใช้เวอร์ชันเดิมต่อได้"]
              : ["Free upgrade within same major version", "Changelog for every release", "No forced updates"],
          },
        ]}
      />

      {/* ── Comparison Table ───────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {isTh ? "เทียบกับวิธีเดิม" : "Compared to Traditional"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isTh ? "เห็นความแตกต่างชัดเจนใน 6 มิติหลัก" : "Six clear differences"}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
              <div className="p-4 font-black text-slate-900 text-sm md:text-base">{isTh ? "หัวข้อ" : "Aspect"}</div>
              <div className="p-4 font-black text-rose-600 text-sm md:text-base text-center border-l border-slate-200">{isTh ? "วิธีเดิม" : "Old Way"}</div>
              <div className="p-4 font-black text-emerald-600 text-sm md:text-base text-center border-l border-slate-200">CNC Costify AI</div>
            </div>
            {[
              { aspect: isTh ? "เวลาคำนวณ / ใบ" : "Time per quote",         old: isTh ? "30-90 นาที" : "30-90 minutes",        ours: isTh ? "5 วินาที" : "5 seconds" },
              { aspect: isTh ? "ความแม่นยำ" : "Accuracy",                   old: isTh ? "ขึ้นอยู่กับคน" : "Depends on person", ours: isTh ? "สูตรเดียวทุกครั้ง" : "Same formula every time" },
              { aspect: isTh ? "ไฟล์ STEP" : "STEP files",                   old: isTh ? "เปิดด้วย CAD แล้ววัดเอง" : "Open CAD + measure manually", ours: isTh ? "Auto ด้วย OpenCASCADE" : "Auto via OpenCASCADE" },
              { aspect: isTh ? "อ่านแบบ PDF/JPG" : "Read PDF/JPG drawings", old: isTh ? "ต้องอ่านเอง" : "Read manually",          ours: isTh ? "AI ดึงข้อมูลให้" : "AI extracts data" },
              { aspect: isTh ? "ฐานข้อมูลวัสดุ" : "Material database",      old: isTh ? "Excel + ความจำ" : "Excel + memory",      ours: isTh ? "100+ พร้อม Density" : "100+ with density" },
              { aspect: isTh ? "บันทึกผลลัพธ์" : "Save results",            old: isTh ? "Copy ใส่ Excel เอง" : "Copy/paste to Excel", ours: isTh ? "Auto Export Format ครบ" : "Auto export, formatted" },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <div className="p-4 font-bold text-slate-700 text-xs md:text-sm">{row.aspect}</div>
                <div className="p-4 text-rose-700 text-xs md:text-sm text-center border-l border-slate-100 line-through opacity-70">{row.old}</div>
                <div className="p-4 text-emerald-700 font-bold text-xs md:text-sm text-center border-l border-slate-100 flex items-center justify-center gap-1">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" />
                  <span>{row.ours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Specs ─────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {isTh ? "รายละเอียดทางเทคนิค" : "Technical Specs"}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Server,   label: isTh ? "OS" : "Operating System",     value: "Windows 10 / 11 (64-bit)" },
              { icon: Cpu,      label: "RAM",                                 value: isTh ? "ขั้นต่ำ 4 GB" : "4 GB minimum" },
              { icon: Download, label: isTh ? "ขนาดไฟล์ติดตั้ง" : "Installer size", value: "~635 MB" },
              { icon: Cloud,    label: isTh ? "การเชื่อมต่อ" : "Connectivity", value: isTh ? "Online (AI) + Offline (Manual)" : "Online (AI) + Offline (Manual)" },
              { icon: Wrench,   label: isTh ? "เทคโนโลยีหลัก" : "Core Tech",   value: "Electron + Python + OCC" },
              { icon: Brain,    label: isTh ? "AI Provider" : "AI Provider",  value: "Gemini, OpenRouter (12+ models)" },
              { icon: Ruler,    label: isTh ? "หน่วยที่รองรับ" : "Units",     value: "mm, mm³, in², kg" },
              { icon: Globe,    label: isTh ? "ภาษา" : "Languages",            value: "ไทย / English" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                </div>
                <div className="text-sm font-black text-slate-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            {isTh ? "พร้อมลองทุกฟีเจอร์แล้วใช่ไหม?" : "Ready to try every feature?"}
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {isTh ? "ทดลองใช้ฟรี 3 ไฟล์/วัน — ติดตั้งบน Windows ไม่ถึง 5 นาที" : "Try free 3 files/day — Windows install in under 5 minutes"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${locale}/download`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all"
            >
              {isTh ? "ดาวน์โหลดทดลองฟรี" : "Download Free Trial"}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all"
            >
              {isTh ? "ดูราคาและแพ็กเกจ" : "View Pricing"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* ── Reusable section component ───────────────────────────────────── */
type FeatureItem = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  bullets: string[];
};

function FeatureSection({
  eyebrow, title, items, accentFrom, accentTo, bg = "bg-white",
}: {
  eyebrow: string;
  title: string;
  items: FeatureItem[];
  accentFrom: string;
  accentTo: string;
  bg?: string;
}) {
  return (
    <section className={`${bg} py-16 md:py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${accentFrom} ${accentTo} text-white text-xs font-black uppercase tracking-wider mb-3`}>
            {eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">
            {title}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {items.map(({ icon: Icon, title: itemTitle, desc, bullets }) => (
            <div key={itemTitle} className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{itemTitle}</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{desc}</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
