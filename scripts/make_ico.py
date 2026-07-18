from PIL import Image
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
SRC_ICON = os.path.join(BASE_DIR, 'icon.png')
OUT_DIR = os.path.join(BASE_DIR, 'assets', 'icons')

SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]

def ensure_out_dir():
    os.makedirs(OUT_DIR, exist_ok=True)

def main():
    ensure_out_dir()
    if not os.path.exists(SRC_ICON):
        raise FileNotFoundError(f"Source icon not found: {SRC_ICON}")
    img = Image.open(SRC_ICON).convert('RGBA')

    # Export PNGs for each size
    for w, h in SIZES:
        resized = img.resize((w, h), resample=Image.LANCZOS)
        out_png = os.path.join(OUT_DIR, f'icon_{w}.png')
        resized.save(out_png, format='PNG')

    # Create multi-resolution ICO suitable for title bar, taskbar, desktop
    out_ico = os.path.join(OUT_DIR, 'app.ico')
    img.save(out_ico, format='ICO', sizes=SIZES)

    # Convenience copies if different names are preferred
    for name in ('titlebar.ico', 'taskbar.ico', 'desktop.ico'):
        dst = os.path.join(OUT_DIR, name)
        if os.path.exists(dst):
            os.remove(dst)
        # Duplicate the generated ICO
        with open(out_ico, 'rb') as src_f, open(dst, 'wb') as dst_f:
            dst_f.write(src_f.read())

    print(f"Generated ICO and PNGs in {OUT_DIR}")

if __name__ == '__main__':
    main()