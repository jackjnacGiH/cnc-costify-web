import os
from PIL import Image, ImageDraw, ImageFont

# Generate a branded Admin icon (different color, with letter 'A')
# Outputs: assets/icons/admin.png and assets/icons/admin.ico

OUTPUT_DIR = os.path.join('assets', 'icons')
PNG_PATH = os.path.join(OUTPUT_DIR, 'admin.png')
ICO_PATH = os.path.join(OUTPUT_DIR, 'admin.ico')

# Distinct Admin color (purple) and letter color (white)
BG_COLOR = (122, 73, 255, 255)  # #7A49FF
TEXT_COLOR = (255, 255, 255, 255)

def _find_font():
    candidates = [
        r"C:\\Windows\\Fonts\\segoeui.ttf",
        r"C:\\Windows\\Fonts\\segoeuib.ttf",
        r"C:\\Windows\\Fonts\\arial.ttf",
        r"C:\\Windows\\Fonts\\arialbd.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=200)
            except Exception:
                continue
    return ImageFont.load_default()

def generate_base_png(size=256):
    img = Image.new('RGBA', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Optional subtle inner circle to add depth
    radius = int(size * 0.48)
    center = (size // 2, size // 2)
    bbox = [center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius]
    inner_color = (BG_COLOR[0], BG_COLOR[1], BG_COLOR[2], 220)
    draw.ellipse(bbox, fill=inner_color)

    # Draw letter 'A' centered
    font = _find_font()
    # Adjust font size dynamically if using truetype
    if hasattr(font, 'path'):
        # scale to ~65% of canvas width
        for s in [int(size*0.7), int(size*0.64), int(size*0.6), int(size*0.56)]:
            try:
                font = ImageFont.truetype(font.path, size=s)
                break
            except Exception:
                continue
    text = 'A'
    # Use textbbox for accurate centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((size - text_w) // 2, (size - text_h) // 2)
    draw.text(pos, text, font=font, fill=TEXT_COLOR)
    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    base = generate_base_png(256)
    # Save PNG for reference
    base.save(PNG_PATH, format='PNG')
    # Save ICO with multiple sizes for Windows
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base.save(ICO_PATH, format='ICO', sizes=sizes)
    print(f"Created: {PNG_PATH} and {ICO_PATH}")

if __name__ == '__main__':
    main()