"""Kitul pentru profesori în Word (editabil): python3 scripts/fise-scoala-docx.py → public/scoala/*.docx"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "scoala")
BROWN = RGBColor(0x6B, 0x3E, 0x12)

def base():
    d = Document()
    for s in d.sections:
        s.top_margin = s.bottom_margin = Cm(1.6)
        s.left_margin = s.right_margin = Cm(1.6)
        f = s.footer.paragraphs[0]
        f.text = "carteaneamului.ro · fișă gratuită pentru proiectul de la școală"
        f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        f.runs[0].font.size = Pt(8)
    st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(11)
    return d

def title(d, t):
    p = d.add_paragraph(); r = p.add_run(t); r.bold = True; r.font.size = Pt(18); r.font.color.rgb = BROWN

# Fișa clasei
d = base()
title(d, "Proiectul „Arborele familiei” – fișa clasei")
d.add_paragraph("Școala: ______________________  Clasa: ______  Cadrul didactic: ______________________  Termen: __________")
heads = ["Nr.", "Elevul", "Arborele", "Interviul", "Prezentarea", "Observații"]
t = d.add_table(rows=31, cols=6); t.style = "Table Grid"
for i, h in enumerate(heads):
    c = t.rows[0].cells[i]; c.text = h; c.paragraphs[0].runs[0].bold = True
for r in range(1, 31):
    t.rows[r].cells[0].text = str(r)
widths = [Cm(1.1), Cm(5.6), Cm(2.4), Cm(2.4), Cm(2.6), Cm(3.8)]
for row in t.rows:
    for i, w in enumerate(widths): row.cells[i].width = w
d.save(os.path.join(OUT, "kit-fisa-clasei.docx"))

# Scrisoarea către părinți
d = base()
title(d, "Dragi părinți,")
paras = [
    (None, "În perioada următoare, la clasă lucrăm la proiectul „Arborele familiei”. Copiii învață ce este o generație, cum se numesc rudele și cum se păstrează amintirile unei familii."),
    ("Ce vă rugăm să faceți acasă: ", "ajutați-l pe copil să completeze fișa cu arborele (el, părinții, bunicii și, dacă știți, străbunicii) și, dacă se poate, să stea de vorbă cu un bunic sau o bunică folosind fișa „Interviul cu bunicii”. Ce nu știți lăsați gol: un arbore cu goluri e perfect pentru o clasă de școală."),
    ("Familii diferite: ", "arborele poate arăta familia în care crește copilul. Cei care l-au crescut au locul lor în fișă. Nu trebuie trecut nimic din ce familia nu dorește să spună."),
    ("Datele rămân ale familiei. ", "Fișele se predau doar la clasă. Dacă vreți să faceți arborele și online, împreună cu rudele, puteți folosi carteaneamului.ro (primele 7 zile gratuite); proiectul nu cere acest lucru."),
    (None, "Termen de predare: ______________________"),
]
for b, txt in paras:
    p = d.add_paragraph()
    if b: p.add_run(b).bold = True
    p.add_run(txt)
p = d.add_paragraph("Vă mulțumim,"); p.add_run().add_break(); p.add_run("______________________"); p.add_run().add_break(); p.add_run("(cadrul didactic)")
d.save(os.path.join(OUT, "kit-scrisoare-parinti.docx"))
print("ok")
