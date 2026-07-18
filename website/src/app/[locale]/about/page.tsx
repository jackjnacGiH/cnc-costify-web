import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Sparkles, Wrench, Brain, Target, Award, Users, Clock, ShieldCheck,
  Cpu, FileSpreadsheet, Layers, Settings2, Zap, ArrowRight, CheckCircle2,
  TrendingUp, Factory, Lightbulb, HeartHandshake,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isTh = locale === "th";

  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="site-hero pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="site-hero-orb" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="site-eyebrow mb-8">
            <Sparkles size={16} className="text-fuchsia-300" />
            {isTh ? "เกี่ยวกับเรา" : "About Us"}
          </div>

          <h1 className="site-hero-title text-4xl md:text-6xl font-black tracking-tight mb-6">
            {isTh ? "ผู้เชี่ยวชาญงาน " : "Specialists in "}
            <span className="site-hero-highlight">CNC</span>
            {isTh ? " ที่เข้าใจปัญหา " : " who understand "}
            <span className="site-hero-highlight">{isTh ? "โรงงานจริง" : "real factory pain"}</span>
          </h1>

          <p className="site-hero-copy text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {isTh
              ? "เราคือทีมที่อยู่ในวงการรับสร้างชิ้นส่วนและอะไหล่เครื่องจักร CNC มากว่าทศวรรษ และเข้าใจดีว่า การคำนวณราคา การสื่อสารกับลูกค้า และความรวดเร็วในการตอบกลับ คือหัวใจของการแข่งขันในยุคนี้"
              : "We've been manufacturing CNC machine parts and spare parts for over a decade. We understand that fast quoting, accurate pricing, and rapid customer response are the lifeblood of modern competitiveness."}
          </p>
        </div>
      </section>

      {/* ── Our Story ──────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                <Lightbulb size={28} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                {isTh ? "เรื่องราวของเรา" : "Our Story"}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {isTh ? "จากปัญหาจริง สู่ทางออกจริง" : "From real pain to real solution"}
              </p>
            </div>
            <div className="md:col-span-2 space-y-4 text-slate-700 leading-relaxed">
              <p>
                {isTh
                  ? "บริษัท เจ แนค (ประเทศไทย) จำกัด เริ่มต้นจากโรงงานรับสร้างชิ้นส่วนเครื่องจักรและอะไหล่ CNC สำหรับลูกค้าในอุตสาหกรรมยานยนต์ อิเล็กทรอนิกส์ และเครื่องจักรอุตสาหกรรม"
                  : "J Nac (Thailand) Co., Ltd. started as a contract manufacturer building CNC machine parts and spare components for automotive, electronics, and industrial machinery clients."}
              </p>
              <p>
                {isTh
                  ? "ในแต่ละวัน เราต้องเสนอราคาให้กับลูกค้าหลายสิบราย — บางงานต้องคำนวณจากแบบ STEP, บางงานต้องอ่านจาก PDF, บางงานต้องโทรไปถามซัพพลายเออร์เรื่องราคาวัสดุ — กระบวนการนี้กินเวลาหลายชั่วโมง บางครั้งกินไปทั้งวัน และที่แย่กว่านั้น คือเสนอราคาช้าจนเสียงาน"
                  : "Every day we quote dozens of jobs — some calculated from STEP files, others from PDF drawings, often phoning suppliers for material prices. The process devoured hours, sometimes whole days. Worst of all: late quotes lost us deals."}
              </p>
              <p>
                {isTh
                  ? "เราจึงเริ่มสร้างเครื่องมือของตัวเองในปี 2569 และพัฒนาต่อเนื่องจนกลายเป็น CNC Costify AI — ซอฟต์แวร์ที่รวมประสบการณ์การทำงานในโรงงานจริง เข้ากับเทคโนโลยี AI เพื่อให้การคำนวณราคา CNC เสร็จในเวลาไม่ถึง 5 วินาที"
                  : "So we built our own tool in 2026 and refined it until it became CNC Costify AI — software that combines real factory floor experience with AI technology to deliver CNC quotes in under 5 seconds."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two Pillars ────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {isTh ? "สองธุรกิจหลัก หนึ่งวิสัยทัศน์" : "Two Pillars, One Vision"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isTh
                ? "เรารับสร้างชิ้นส่วน CNC ให้ลูกค้าจริง และพัฒนา AI ให้ทั้งอุตสาหกรรมทำงานได้เร็วขึ้น"
                : "We manufacture CNC parts for real clients, and build AI that helps the entire industry move faster."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Pillar 1 — Manufacturing */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Wrench size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                {isTh ? "รับสร้างชิ้นส่วน อะไหล่เครื่องจักร CNC" : "CNC Parts & Spare Components Manufacturing"}
              </h3>
              <p className="text-slate-600 mb-5 leading-relaxed">
                {isTh
                  ? "บริการครบวงจร ตั้งแต่ออกแบบ DFM (Design for Manufacturing), Programming CAM, จนถึงผลิตและตรวจสอบคุณภาพ รองรับทั้งงานแบบ Prototype และผลิตเป็นชุด (Batch Production)"
                  : "End-to-end service from DFM (Design for Manufacturing) consulting, CAM programming, to production and QC inspection. Prototype runs and batch production both supported."}
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                {(isTh
                  ? [
                      "เครื่อง CNC Milling , CNC Lathe, Wire Cut, EDM",
                      "วัสดุครบครัน — เหล็ก, สแตนเลส, อลูมิเนียม, ทองเหลือง, พลาสติก/POM",
                      "งาน Coating: Anodize, Hard Chrome, Black Oxide, Zinc Plating ฯลฯ",
                      "มีการตรวจเช็คชิ้นงานตามมาตรฐาน ทุกชิ้น",
                      "ระยะเวลาผลิต 3-15 วันทำการ ตามความซับซ้อน",
                    ]
                  : [
                      "CNC Milling, CNC Lathe, Wire Cut, EDM",
                      "Wide material range — steel, stainless, aluminum, brass, plastics/POM",
                      "Coating: Anodize, Hard Chrome, Black Oxide, Zinc Plating, etc.",
                      "Standard quality inspection on every part",
                      "Lead time 3-15 working days based on complexity",
                    ]
                ).map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pillar 2 — AI Tools */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Brain size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                {isTh ? "พัฒนาเครื่องมือ AI สำหรับอุตสาหกรรม CNC" : "AI Tools for the CNC Industry"}
              </h3>
              <p className="text-slate-600 mb-5 leading-relaxed">
                {isTh
                  ? "CNC Costify AI คือผลผลิตจากปัญหาจริงในโรงงาน — เราออกแบบให้ใช้งานง่ายแม้ผู้ที่ไม่เก่งคอมพิวเตอร์ แต่มีพลังการคำนวณระดับเดียวกับวิศวกรอาวุโส"
                  : "CNC Costify AI was born from real factory pain — designed to be usable even for non-tech staff, yet powered by senior-engineer-level calculation logic."}
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                {(isTh
                  ? [
                      "วิเคราะห์ไฟล์ STEP อัตโนมัติด้วย OpenCASCADE (วัด Volume + Stock Size)",
                      "อ่านแบบ PDF/JPG ด้วย Multi-AI (Gemini + OpenRouter Fallback)",
                      "ฐานข้อมูลวัสดุ 100+ รายการ พร้อมราคาที่อัปเดตได้",
                      "บันทึกผลลัพธ์เป็น Excel ได้ทันที พร้อมใช้ส่งลูกค้า",
                      "Desktop app — ใช้งาน Offline ได้ ปลอดภัยข้อมูลในเครื่องคุณ",
                    ]
                  : [
                      "Automated STEP file analysis with OpenCASCADE (Volume + Stock Size)",
                      "PDF/JPG drawing reading via Multi-AI (Gemini + OpenRouter fallback)",
                      "100+ material database with editable pricing",
                      "Instant Excel export — ready to send to clients",
                      "Desktop app — works offline, your data stays on your machine",
                    ]
                ).map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center mb-5">
                <Target size={28} className="text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-5">
                {isTh ? "พันธกิจของเรา" : "Our Mission"}
              </h2>
              <p className="text-lg md:text-xl text-blue-50 leading-relaxed mb-6">
                {isTh
                  ? "ทำให้การทำงานเกี่ยวกับการผลิตชิ้นส่วนและอะไหล่เครื่องจักร CNC ง่ายขึ้น เร็วขึ้น และมีประสิทธิภาพสูงขึ้น — ลดเวลาคำนวณราคาจากชั่วโมงเหลือเพียงวินาที เพื่อให้ผู้ประกอบการไทยแข่งขันได้ในตลาดโลก"
                  : "To make CNC parts and spare component manufacturing easier, faster, and more efficient — reducing quote time from hours to seconds so Thai manufacturers can compete on the world stage."}
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-8">
                {(isTh
                  ? [
                      { icon: Zap, title: "เร็ว", desc: "5 วินาที / 1 ใบเสนอราคา" },
                      { icon: ShieldCheck, title: "แม่นยำ", desc: "ระดับเดียวกับวิศวกรอาวุโส" },
                      { icon: HeartHandshake, title: "ใช้ง่าย", desc: "ออกแบบเพื่อโรงงานจริง" },
                    ]
                  : [
                      { icon: Zap, title: "Fast", desc: "5 seconds per quote" },
                      { icon: ShieldCheck, title: "Accurate", desc: "Senior engineer-level logic" },
                      { icon: HeartHandshake, title: "Easy", desc: "Built for real factories" },
                    ]
                ).map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20">
                    <Icon size={24} className="mb-2" />
                    <div className="font-black text-lg">{title}</div>
                    <div className="text-sm text-blue-100">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Us / Numbers ───────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {isTh ? "ทำไมต้องเป็นเรา" : "Why Choose Us"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isTh
                ? "ตัวเลขที่เกิดจากการอยู่ในอุตสาหกรรม CNC จริง ไม่ใช่แค่ทฤษฎี"
                : "Numbers built from real CNC industry experience — not just theory"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {[
              { icon: Clock,    value: isTh ? "10+ ปี" : "10+ yrs",     label: isTh ? "ประสบการณ์ในอุตสาหกรรม CNC" : "CNC industry experience",        color: "from-blue-500 to-cyan-500" },
              { icon: Factory,  value: "5,000+",                          label: isTh ? "ชิ้นงานที่ส่งมอบสำเร็จ" : "Parts delivered successfully",     color: "from-emerald-500 to-teal-500" },
              { icon: Cpu,      value: "100+",                            label: isTh ? "วัสดุในฐานข้อมูล" : "Materials in database",                  color: "from-purple-500 to-pink-500" },
              { icon: Zap,      value: "5s",                              label: isTh ? "เวลาคำนวณราคา / ใบ" : "Quote time per drawing",              color: "from-amber-500 to-orange-500" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm text-center">
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${color} items-center justify-center mb-3 shadow`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{value}</div>
                <div className="text-xs md:text-sm text-slate-600 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* Why us — value props */}
          <div className="grid md:grid-cols-3 gap-6">
            {(isTh
              ? [
                  { icon: Award,      title: "คุณภาพ",                  desc: "ทุกชิ้นงานผ่านการตรวจสอบขนาด ด้วยเครื่องมือวัดที่ได้มาตรฐาน" },
                  { icon: Users,      title: "ทีมงานมืออาชีพ",          desc: "วิศวกรและช่าง CNC ที่มีประสบการณ์เฉลี่ยกว่า 15 ปี ในอุตสาหกรรมจริง" },
                  { icon: TrendingUp, title: "พัฒนาต่อเนื่อง",         desc: "อัปเดต AI Model และฐานข้อมูลวัสดุสม่ำเสมอ ฟังเสียงผู้ใช้งานทุกเดือน" },
                ]
              : [
                  { icon: Award,      title: "Quality",                desc: "Every part inspected with standard measuring instruments" },
                  { icon: Users,      title: "Expert Team",            desc: "Engineers and CNC machinists with 15+ years average industry experience" },
                  { icon: TrendingUp, title: "Constant Improvement",   desc: "AI models and material database updated continuously, listening to users monthly" },
                ]
            ).map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center mb-4 shadow">
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it helps you ───────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {isTh ? "เราช่วยธุรกิจคุณได้อย่างไร" : "How We Help Your Business"}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isTh
                ? "ไม่ว่าคุณจะเป็นโรงงานรับงาน CNC, ฝ่ายจัดซื้อ, หรือฟรีแลนซ์ออกแบบเครื่องจักร — เราเข้าใจคุณ"
                : "Whether you're a CNC job shop, purchasing dept., or freelance machinery designer — we get you"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(isTh
              ? [
                  {
                    icon: Factory,
                    title: "สำหรับโรงงาน CNC",
                    color: "from-blue-500 to-indigo-600",
                    points: [
                      "เสนอราคาได้เร็วกว่าคู่แข่ง 10 เท่า — ปิดดีลก่อนใคร",
                      "พนักงานใหม่คำนวณราคาเองได้ ไม่ต้องรอวิศวกรอาวุโส",
                      "ลดข้อผิดพลาด — ระบบใช้สูตรเดียวกันทุกครั้ง ไม่พึ่งความจำคน",
                      "ทำงานนอกเวลาได้ ไม่ต้องเปิดออฟฟิศ",
                    ],
                  },
                  {
                    icon: FileSpreadsheet,
                    title: "สำหรับฝ่ายจัดซื้อ / เจ้าของผลิตภัณฑ์",
                    color: "from-emerald-500 to-teal-600",
                    points: [
                      "ประเมินราคาคร่าวๆ ก่อนส่งให้ซัพพลายเออร์ — รู้ก่อนว่าควรอยู่ในกรอบเท่าไหร่",
                      "เปรียบเทียบใบเสนอราคาจากหลายเจ้าได้อย่างมีหลักการ",
                      "ลดการต่อรองที่เสียเวลา — มีข้อมูลในมือ พูดคุยตรงประเด็น",
                      "Export Excel ใส่ในระบบ ERP ได้ทันที",
                    ],
                  },
                  {
                    icon: Settings2,
                    title: "สำหรับฟรีแลนซ์ / นักออกแบบ",
                    color: "from-purple-500 to-pink-600",
                    points: [
                      "ประเมินต้นทุนการผลิตตั้งแต่ขั้นออกแบบ — ปรับแบบให้ผลิตคุ้มก่อนส่งลูกค้า",
                      "ใช้ตอนพรีเซ็นต์ลูกค้า — แสดงราคาทันทีหน้าจอ ดูเป็นมืออาชีพ",
                      "ราคาแพ็กเกจที่ใช้ส่วนตัวได้ในราคาเหมาะสม",
                    ],
                  },
                  {
                    icon: Layers,
                    title: "สำหรับนักศึกษา / ผู้สนใจ",
                    color: "from-amber-500 to-orange-600",
                    points: [
                      "ทดลองใช้ฟรี — เรียนรู้กระบวนการคำนวณต้นทุน CNC จริง",
                      "เข้าใจสูตรและตัวแปรที่ใช้ในอุตสาหกรรม",
                      "ใช้ทำโปรเจกต์จบ / นำเสนอในวิชาเรียนได้",
                    ],
                  },
                ]
              : [
                  {
                    icon: Factory,
                    title: "For CNC Job Shops",
                    color: "from-blue-500 to-indigo-600",
                    points: [
                      "Quote 10× faster than competitors — close deals first",
                      "New staff can quote without waiting for senior engineers",
                      "Reduce errors — same formula every time, no human memory",
                      "Quote after hours, no need to open the office",
                    ],
                  },
                  {
                    icon: FileSpreadsheet,
                    title: "For Purchasing / Product Owners",
                    color: "from-emerald-500 to-teal-600",
                    points: [
                      "Pre-quote estimate before sending to suppliers — know your target",
                      "Compare supplier quotes with a baseline",
                      "Negotiate from data, not guesswork",
                      "Excel export drops straight into your ERP",
                    ],
                  },
                  {
                    icon: Settings2,
                    title: "For Freelancers / Designers",
                    color: "from-purple-500 to-pink-600",
                    points: [
                      "Cost-aware design from day one — adjust before sending to client",
                      "Live demo cost on screen during client presentations",
                      "Affordable personal-use plans",
                    ],
                  },
                  {
                    icon: Layers,
                    title: "For Students / Enthusiasts",
                    color: "from-amber-500 to-orange-600",
                    points: [
                      "Free trial — learn real CNC costing process",
                      "Understand industry formulas and variables",
                      "Use it for senior projects / class presentations",
                    ],
                  },
                ]
            ).map(({ icon: Icon, title, color, points }) => (
              <div key={title} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="font-black text-slate-900">{title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">▸</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            {isTh ? "พร้อมประหยัดเวลาคำนวณราคาแล้วหรือยัง?" : "Ready to save quoting time?"}
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            {isTh
              ? "ทดลองใช้ฟรี 3 ไฟล์/วัน ไม่ต้องผูกบัตรเครดิต ใช้ได้ทันทีบน Windows"
              : "Try free 3 files/day — no credit card, instant Windows install"}
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
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all"
            >
              {isTh ? "ติดต่อสอบถาม" : "Contact Us"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
