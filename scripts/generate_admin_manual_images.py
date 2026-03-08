import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join('assets', 'manual', 'admin')

BG = (15, 23, 42)          # slate-900
CARD = (17, 24, 39)        # slate-800
TEXT = (229, 231, 235)     # slate-200
MUTED = (148, 163, 184)    # slate-400
PRIMARY = (59, 130, 246)   # blue-500
ACCENT = (34, 197, 94)     # green-500
DANGER = (239, 68, 68)     # red-500
BORDER = (148, 163, 184, 64)

W, H = 1200, 800


def find_font(size=28, bold=False):
    candidates = [
        r"C:\\Windows\\Fonts\\segoeui.ttf",
        r"C:\\Windows\\Fonts\\segoeuib.ttf" if bold else r"C:\\Windows\\Fonts\\segoeui.ttf",
        r"C:\\Windows\\Fonts\\arialbd.ttf" if bold else r"C:\\Windows\\Fonts\\arial.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_header(draw, title, subtitle):
    font_title = find_font(40, bold=True)
    font_sub = find_font(24)
    draw.text((40, 30), title, font=font_title, fill=TEXT)
    draw.text((40, 85), subtitle, font=font_sub, fill=MUTED)


def rounded_rect(draw, xy, radius=16, fill=CARD, outline=BORDER, width=2):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    img.save(path)
    print(f"Saved {path}")


def fig_01_main_window():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'Admin License Tool', 'ภาพรวมหน้าต่างหลักและองค์ประกอบสำคัญ')
    # Cards
    rounded_rect(d, (40, 140, 580, 300))
    rounded_rect(d, (620, 140, 1160, 300))
    rounded_rect(d, (40, 320, 1160, 600))
    rounded_rect(d, (40, 620, 1160, 740))

    # Labels
    font_h3 = find_font(28, bold=True)
    font = find_font(22)
    d.text((60, 155), 'คีย์และการอ้างอิง', font=font_h3, fill=TEXT)
    d.text((80, 200), '• ปุ่ม เลือกไฟล์คีย์ส่วนตัว (PEM)\n• แสดง path คีย์ที่เลือก', font=font, fill=MUTED)

    d.text((640, 155), 'pubkey_id', font=font_h3, fill=TEXT)
    d.text((660, 200), '• ค่าเริ่มต้น: admin-key-2025\n• ใช้คู่กับลายเซ็น', font=font, fill=MUTED)

    d.text((60, 335), 'รายละเอียดไลเซนส์', font=font_h3, fill=TEXT)
    d.text((80, 375), '• Hardware ID\n• License ID (ทางเลือก)\n• Days, Grace Period, Time Tolerance\n• Mode: revoke หรือ active\n• ปุ่ม สร้างไฟล์', font=font, fill=MUTED)

    d.text((60, 635), 'ผลลัพธ์ (Preview) และบันทึก', font=font_h3, fill=TEXT)
    d.text((80, 675), '• แสดง JSON ที่จะบันทึก\n• ปุ่ม บันทึกเป็น license.dat', font=font, fill=MUTED)

    save(img, 'figure_01_main_window.png')


def fig_02_select_key():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'เลือกคีย์ส่วนตัว (PEM)', 'ขั้นตอนการเลือกคีย์ที่ใช้ลงลายเซ็น Ed25519')
    rounded_rect(d, (40, 140, 1160, 700))
    font = find_font(24)
    font_b = find_font(28, bold=True)
    d.text((60, 160), 'ขั้นตอน:', font=font_b, fill=TEXT)
    steps = [
        '1) คลิกปุ่ม "เลือกไฟล์คีย์ส่วนตัว..."',
        '2) เลือกไฟล์ .pem ที่ตรงกับคีย์ Admin',
        '3) ยืนยันว่ามีข้อความสถานะ "โหลดคีย์เรียบร้อย" และแสดง path',
    ]
    y = 200
    for s in steps:
        d.text((80, y), s, font=font, fill=TEXT)
        y += 40
    d.text((60, y+20), 'ข้อควรระวัง: เก็บรักษาคีย์ส่วนตัวอย่างปลอดภัย ห้ามเผยแพร่', font=font, fill=DANGER)
    save(img, 'figure_02_select_key.png')


def fig_03_license_form():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'กรอกแบบฟอร์มไลเซนส์', 'รายละเอียดที่ต้องระบุและการคำนวณเวลาอัตโนมัติ')
    rounded_rect(d, (40, 140, 1160, 700))
    font = find_font(24)
    items = [
        '• Hardware ID: ใส่ค่าที่ได้จากเครื่องลูกค้า (เช่น sha256:<hash>)',
        '• License ID (ทางเลือก): ใส่รหัสอ้างอิงใบอนุญาต',
        '• Days: จำนวนวันใช้งาน (เช่น 365)',
        '• Grace Period: วันผ่อนผันหลังหมดอายุ (เช่น 0)',
        '• Time Tolerance: อนุโลมความคลาดเคลื่อนเวลาเป็นวินาที (เช่น 300)',
        '• Mode: revoke (ปิดสิทธิ์) หรือ active (ใช้งานปกติ)',
        '• ระบบตั้งเวลาอัตโนมัติ: Not Before = ตอนนี้ - 30 นาที; Expires At = ตอนนี้ + Days',
    ]
    y = 170
    for it in items:
        d.text((60, y), it, font=font, fill=TEXT)
        y += 36
    save(img, 'figure_03_license_form.png')


def fig_04_preview_save():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'พรีวิวและบันทึกไฟล์', 'ตรวจสอบ JSON และบันทึกเป็น license.dat')
    rounded_rect(d, (40, 140, 1160, 700))
    font = find_font(24)
    lines = [
        '1) กดปุ่ม "สร้างไฟล์" เพื่อสร้าง JSON (ต้องเลือกคีย์ก่อน)',
        '2) ตรวจสอบค่า payload, pubkey_id, signature ในช่อง Preview',
        '3) กด "บันทึกเป็น license.dat" เพื่อเลือกตำแหน่งไฟล์ปลายทาง',
        '4) ยืนยันสถานะ "บันทึกเรียบร้อย" และ path ที่ได้',
    ]
    y = 170
    for ln in lines:
        d.text((60, y), ln, font=font, fill=TEXT)
        y += 40
    save(img, 'figure_04_preview_save.png')


def fig_05_modes():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'โหมดการใช้งานไลเซนส์', 'เปรียบเทียบ revoke กับ active')
    # Two columns
    rounded_rect(d, (40, 160, 580, 700))
    rounded_rect(d, (620, 160, 1160, 700))
    font_b = find_font(28, bold=True)
    font = find_font(24)
    d.text((60, 180), 'revoke', font=font_b, fill=DANGER)
    d.text((60, 230), '• ใส่ payload.revoked = true\n• ใช้สำหรับปิดสิทธิ์ใช้งาน\n• ลูกค้าจะไม่สามารถเปิดใช้หลังยืนยัน', font=font, fill=TEXT)
    d.text((640, 180), 'active', font=font_b, fill=ACCENT)
    d.text((640, 230), '• ไม่ใส่ revoked\n• เปิดสิทธิ์ใช้งานครบกำหนดวัน\n• ใช้ Grace/Time Tolerance ตามที่กำหนด', font=font, fill=TEXT)
    save(img, 'figure_05_modes.png')


def fig_06_offline_flow():
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_header(d, 'ขั้นตอนการออกไลเซนส์แบบออฟไลน์', 'ภาพรวมการทำงานระหว่าง Admin และเครื่องลูกค้า')
    rounded_rect(d, (40, 160, 1160, 700))
    font_b = find_font(28, bold=True)
    font = find_font(24)
    d.text((60, 180), 'กระบวนการ:', font=font_b, fill=TEXT)
    steps = [
        '1) ลูกค้าส่ง Hardware ID ให้ผู้ดูแล',
        '2) ผู้ดูแลเลือกคีย์ส่วนตัว + กรอกฟอร์ม + สร้าง JSON',
        '3) บันทึก license.dat และส่งให้ลูกค้า',
        '4) ลูกค้าวาง license.dat ในตำแหน่งที่กำหนดและเปิดใช้งาน',
        '5) ระบบตรวจลายเซ็น + เวลา + Grace/Tolerance เพื่ออนุมัติ',
    ]
    y = 220
    for s in steps:
        d.text((80, y), s, font=font, fill=TEXT)
        y += 40
    save(img, 'figure_06_offline_flow.png')


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    fig_01_main_window()
    fig_02_select_key()
    fig_03_license_form()
    fig_04_preview_save()
    fig_05_modes()
    fig_06_offline_flow()


if __name__ == '__main__':
    main()