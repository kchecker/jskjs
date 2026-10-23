"""Generate 1200x630 Open Graph images + icons for every page (run after build.js)."""
import json, sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'public')
TMP = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
def static(src, dst, **axes):
    f = TTFont(src); f.flavor = None
    instancer.instantiateVariableFont(f, axes, inplace=True); f.save(dst); return dst
disp = static(f'{SITE}/static/assets/fonts/archivo.woff2', f'{TMP}/archivo-x.ttf', wght=850, wdth=118)
mono = static(f'{SITE}/static/assets/fonts/martian-mono.woff2', f'{TMP}/martian.ttf', wght=600, wdth=90)
COL = {'core': '#4D7CFF', 'hyper': '#FF4F8B', 'pulse': '#22CFA2', 'motion': '#FFB224', 'util': '#9AA3C7'}
RACK, INK, MUTED, LINE = '#13152B', '#E9EBF7', '#A1A6C6', '#2E3258'

def wrap(draw, text, font, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def og(item):
    im = Image.new('RGB', (1200, 630), RACK); d = ImageDraw.Draw(im)
    c = COL.get(item['mod'], COL['motion'])
    for y in range(20, 630, 38):
        d.ellipse((10, y, 18, y + 8), fill=LINE); d.ellipse((1182, y, 1190, y + 8), fill=LINE)
    d.arc((620, 260, 1500, 1000), 200, 300, fill=c, width=14)
    d.ellipse((76, 74, 98, 96), fill=c)
    d.text((112, 72), item['kicker'].upper()[:48], font=ImageFont.truetype(mono, 24), fill=c)
    size = 86
    while size > 44:
        f = ImageFont.truetype(disp, size); lines = wrap(d, item['title'], f, 960)
        if len(lines) <= 3: break
        size -= 6
    y = 150
    for ln in lines: d.text((72, y), ln, font=f, fill=INK); y += int(size * 1.08)
    bf = ImageFont.truetype(disp, 40)
    for i, k in enumerate(['core', 'hyper', 'pulse', 'motion']):
        d.pieslice((72, 520, 132, 580), -90 + i * 90, i * 90, fill=COL[k])
    d.ellipse((82, 530, 122, 570), fill=RACK); d.text((92, 531), '$', font=ImageFont.truetype(mono, 28), fill=INK)
    d.text((150, 527), 'jsKjs', font=bf, fill=INK)
    d.text((300, 541), 'jskjs.org', font=ImageFont.truetype(mono, 22), fill=MUTED)
    im.save(os.path.join(OUT, 'assets/og', item['slug'] + '.png'), optimize=True)

os.makedirs(os.path.join(OUT, 'assets/og'), exist_ok=True)
items = json.load(open(os.path.join(SITE, 'og-manifest.json')))
for it in items: og(it)
# icons
def icon(n):
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for i, k in enumerate(['core', 'hyper', 'motion', 'pulse']):
        d.pieslice((0, 0, n - 1, n - 1), -90 + i * 90, i * 90, fill=COL[k])
    m = n * .16; d.ellipse((m, m, n - m, n - m), fill=RACK)
    f = ImageFont.truetype(mono, int(n * .48)); w = d.textlength('$', font=f)
    d.text(((n - w) / 2, n * .2), '$', font=f, fill=INK); return im
bg = Image.new('RGB', (180, 180), RACK); bg.paste(icon(150), (15, 15), icon(150)); bg.save(os.path.join(OUT, 'apple-touch-icon.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(64).save(os.path.join(OUT, 'favicon.ico'), sizes=[(32, 32), (16, 16)])
print(len(items), 'og images')
