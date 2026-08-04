"""
Generate favicon files from profile.jpg using Pillow.
Run:
  pip install pillow
  python make_favicons.py

Outputs: favicon.ico, favicon-32.png, favicon-16.png, apple-touch-icon.png
Place these files in your site root and push to GitHub Pages.
"""
from PIL import Image
import sys

SRC = 'assets/images/profile.jpg'
OUT_DIR = 'assets/icons'
try:
    img = Image.open(SRC).convert('RGBA')
except FileNotFoundError:
    print(f"Source image '{SRC}' not found in current directory.")
    sys.exit(1)

sizes = {
    'favicon-32.png': (32, 32),
    'favicon-16.png': (16, 16),
    'apple-touch-icon.png': (180, 180),
}

for name, size in sizes.items():
    out = img.copy()
    out.thumbnail(size, Image.LANCZOS)
    out.save(f'{OUT_DIR}/{name}')
    print('Wrote', f'{OUT_DIR}/{name}')

# Create multi-size ICO
ico_sizes = [(64,64),(48,48),(32,32),(16,16)]
icons = []
for s in ico_sizes:
    tmp = img.copy()
    tmp.thumbnail(s, Image.LANCZOS)
    icons.append(tmp)

icons[0].save(f'{OUT_DIR}/favicon.ico', format='ICO', sizes=ico_sizes)
print('Wrote', f'{OUT_DIR}/favicon.ico')
print('\nDone. These files are now in assets/icons, commit, push, and hard-refresh your site (Ctrl+F5).')
