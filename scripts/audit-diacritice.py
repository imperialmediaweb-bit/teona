#!/usr/bin/env python3
"""Caută textele preluate din WordPress cărora le lipsesc diacriticele.

Pe site-ul vechi, diacriticele sunt puse inconsecvent: „Nimic fara Dumnezeu”
lângă „Nimic fără Dumnezeu”, „Redirectioneaza” lângă „Redirecționează”. Caietul
de sarcini cere ca tot conținutul să fie „în limba română, cu diacritice”.

Scriptul nu rescrie nimic. Numără și arată, ca să știm ce avem de corectat și
să putem verifica, la final, că nu a mai rămas nimic.

Rulare:  python3 scripts/audit-diacritice.py
"""

import json
import os
import re
import sys
from collections import Counter

RADACINA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTINUT = os.path.join(RADACINA, "continut")

DIACRITICE = "ăâîșțĂÂÎȘȚ"

# Sedilele: ş ţ (U+015F, U+0163) în loc de ș ț (U+0219, U+021B). Arată aproape
# la fel, dar sunt litere turcești. Multe texte vechi le folosesc.
SEDILE = {"ş": "ș", "Ş": "Ș", "ţ": "ț", "Ţ": "Ț"}

# Cuvinte frecvente în textele asociației, scrise fără diacritice. Perechea e
# <fără diacritice> -> <corect>. Lista e pentru raport, nu pentru înlocuire
# automată: „fara” e mereu „fără”, dar „tari” poate fi și „tari”, și „țări”.
CUVINTE = {
    "fara": "fără",
    "tabara": "tabără",
    "tabara.": "tabără",
    "tabere": None,  # corect fără diacritice
    "copii": None,
    "parinti": "părinți",
    "parintii": "părinții",
    "parintilor": "părinților",
    "asociatia": "asociația",
    "asociatiei": "asociației",
    "redirectioneaza": "redirecționează",
    "directioneaza": "direcționează",
    "sprijinim": None,
    "voluntari": None,
    "bucuria": None,
    "dizabilitati": "dizabilități",
    "activitati": "activități",
    "nevoi": None,
    "speciali": None,
    "multumim": "mulțumim",
    "sustine": "susține",
    "sustin": "susțin",
    "donatie": "donație",
    "donatii": "donații",
    "impozit": None,
    "contact": None,
    "proiecte": None,
    "povestea": None,
    "sanatate": "sănătate",
    "scoala": "școală",
    "invata": "învață",
    "joaca": "joacă",
    "familiile": None,
    "familiilor": None,
    "incredere": "încredere",
    "impreuna": "împreună",
    "ingrijire": "îngrijire",
    "intalniri": "întâlniri",
    "sedinta": "ședință",
    "tara": "țară",
    "anual": None,
    "conditii": "condiții",
    "confidentialitate": "confidențialitate",
    "informatii": "informații",
    "situatii": "situații",
    "atentia": "atenția",
    "rabdarea": "răbdarea",
    "deosebite": None,
    "educational": "educațional",
    "socializare": None,
    "consiliere": None,
}
GRESELI = {gresit: corect for gresit, corect in CUVINTE.items() if corect}

CAMPURI_TEXT = ("titlu", "text", "textHtml", "rezumat", "descriere", "rol", "nume", "alt")


def curata_html(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;|&#\d+;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def aduna_texte(nod, iesire, cale=""):
    """Toate șirurile dintr-un JSON, cu drumul până la ele."""
    if isinstance(nod, dict):
        for cheie, valoare in nod.items():
            aduna_texte(valoare, iesire, f"{cale}.{cheie}" if cale else cheie)
    elif isinstance(nod, list):
        for i, element in enumerate(nod):
            aduna_texte(element, iesire, f"{cale}[{i}]")
    elif isinstance(nod, str) and len(nod) > 3:
        iesire.append((cale, nod))


def main():
    fisiere = sorted(
        f for f in os.listdir(CONTINUT) if f.endswith(".json")
    )

    total_sedile = Counter()
    total_cuvinte = Counter()
    exemple = []
    texte_romanesti = 0
    texte_fara_diacritice = 0

    for fisier in fisiere:
        date = json.load(open(os.path.join(CONTINUT, fisier), encoding="utf8"))
        texte = []
        aduna_texte(date, texte)

        for cale, brut in texte:
            if cale.split(".")[-1].split("[")[0] not in CAMPURI_TEXT and "text" not in cale.lower():
                continue
            text = curata_html(brut)
            if len(text) < 25:
                continue

            for sedila in SEDILE:
                if sedila in text:
                    total_sedile[sedila] += text.count(sedila)

            cuvinte = re.findall(r"\b[a-zșțăâî]+\b", text.lower())
            gasite = [c for c in cuvinte if c in GRESELI]
            for c in gasite:
                total_cuvinte[c] += 1

            # Text care arată românesc dar n-are nicio diacritică
            if len(text) > 80:
                texte_romanesti += 1
                if not any(d in text for d in DIACRITICE):
                    texte_fara_diacritice += 1
                    if len(exemple) < 12:
                        exemple.append((fisier, cale, text[:110]))

    print("=" * 72)
    print("SEDILE în loc de virgulă dedesubt (ş/ţ turcesc în loc de ș/ț)")
    print("=" * 72)
    if total_sedile:
        for sedila, n in total_sedile.most_common():
            print(f"  {sedila} -> {SEDILE[sedila]} : {n} apariții")
        print(f"  TOTAL: {sum(total_sedile.values())}")
    else:
        print("  niciuna")

    print()
    print("=" * 72)
    print("CUVINTE scrise fără diacritice")
    print("=" * 72)
    if total_cuvinte:
        for cuvant, n in total_cuvinte.most_common(30):
            print(f"  {cuvant:24s} -> {GRESELI[cuvant]:24s} {n:4d}×")
        print(f"  TOTAL apariții: {sum(total_cuvinte.values())}")
    else:
        print("  niciunul")

    print()
    print("=" * 72)
    print(f"TEXTE LUNGI (>80 caractere) fără nicio diacritică: "
          f"{texte_fara_diacritice} din {texte_romanesti}")
    print("=" * 72)
    for fisier, cale, bucata in exemple:
        print(f"  {fisier} · {cale}")
        print(f"    {bucata}…")

    return 1 if (total_sedile or total_cuvinte) else 0


if __name__ == "__main__":
    sys.exit(main())
