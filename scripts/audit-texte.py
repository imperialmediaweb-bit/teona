#!/usr/bin/env python3
"""Triază textele preluate din WordPress: ce e real, ce e demo, ce e de corectat.

Caietul de sarcini cere două lucruri care se bat cap în cap dacă nu le separi:
„tot conținutul este în limba română, cu diacritice” și „se elimină orice text în
engleză rămas din șablon”. Deci nu tot ce e în export merge pe site-ul nou.

Scriptul împarte textele în trei:

  DEMO     — rămășițe ale temei Risehand: engleză, „Lorem ipsum”, adrese și
             telefoane inventate, support@gmail.com. Se aruncă.
  DE_REPARAT — română reală, dar cu sedile (ţ în loc de ț) sau fără diacritice.
  BUN      — română reală, scrisă corect.

Nu rescrie nimic de capul lui. Scoate un raport și `continut/texte-triaj.json`,
din care se lucrează mai departe.

Rulare:  python3 scripts/audit-texte.py
"""

import json
import os
import re
import sys
from collections import Counter

RADACINA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTINUT = os.path.join(RADACINA, "continut")
IESIRE = os.path.join(CONTINUT, "texte-triaj.json")

DIACRITICE = set("ăâîșțĂÂÎȘȚ")
SEDILE = {"ş": "ș", "Ş": "Ș", "ţ": "ț", "Ţ": "Ț"}

# Urme sigure ale temei demo. Dacă apare una, textul nu e al asociației.
SEMNE_DEMO = [
    r"lorem ipsum", r"sorem ipsum", r"dolor sit amet",
    r"support@gmail\.com", r"\+1800900122", r"575 main street",
    r"themepanthers", r"risehand", r"vc_row|vc_column|\[/?vc_",
    r"i am text block", r"click edit button",
    r"your donation", r"learn more about", r"read more",
    r"non profit charity fundation", r"raise your hands",
]

# Cuvinte englezești frecvente; multe într-un text scurt înseamnă engleză.
CUVINTE_EN = set("""the and of to for with your our you we is are have has
donation donate charity children education help support about more read
company team volunteer volunteers church people world community give giving
contact us home page welcome services service mission vision learn join
best better than way time money gifts poor need needs make making""".split())

# Cuvinte românești frecvente, ca să recunoaștem româna chiar fără diacritice.
CUVINTE_RO = set("""si sau de la cu pe pentru din care sunt este au fost nu
copii copiii parinti parintii asociatia teona ariana suceava tabara tabere
donatie donatii voluntar voluntari sprijin bucurie familie familii casa
noastra nostru nostri lor ne te ti isi mai foarte prin catre fara impreuna
toti toate fiecare""".split())

CUVINTE_FARA_DIACRITICE = {
    "fara": "fără", "asociatia": "asociația", "asociatiei": "asociației",
    "redirectioneaza": "redirecționează", "directioneaza": "direcționează",
    "tabara": "tabără", "activitati": "activități", "joaca": "joacă",
    "educational": "educațional", "parinti": "părinți", "parintii": "părinții",
    "parintilor": "părinților", "dizabilitati": "dizabilități",
    "multumim": "mulțumim", "sustine": "susține", "sustin": "susțin",
    "donatie": "donație", "donatii": "donații", "conditii": "condiții",
    "confidentialitate": "confidențialitate", "informatii": "informații",
    "situatii": "situații", "impreuna": "împreună", "incredere": "încredere",
    "intalniri": "întâlniri", "invata": "învață", "scoala": "școală",
    "sanatate": "sănătate", "tara": "țară", "sedinta": "ședință",
    "atentia": "atenția", "rabdarea": "răbdarea", "deosebita": "deosebită",
}

CAMPURI = ("titlu", "text", "textHtml", "rezumat", "descriere", "rol", "alt", "html")


def curata(text):
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;|&#\d+;", " ", text)
    text = re.sub(r"\[/?[a-z_]+[^\]]*\]", " ", text)  # shortcode-uri
    return re.sub(r"\s+", " ", text).strip()


def aduna(nod, iesire, cale=""):
    if isinstance(nod, dict):
        for cheie, valoare in nod.items():
            aduna(valoare, iesire, f"{cale}.{cheie}" if cale else cheie)
    elif isinstance(nod, list):
        for i, element in enumerate(nod):
            aduna(element, iesire, f"{cale}[{i}]")
    elif isinstance(nod, str):
        iesire.append((cale, nod))


def clasifica(text):
    """-> ('demo' | 'de_reparat' | 'bun', [motive])"""
    jos = text.lower()
    motive = []

    for semn in SEMNE_DEMO:
        if re.search(semn, jos):
            motive.append(f"șablon: {semn}")
            return "demo", motive

    cuvinte = re.findall(r"\b[a-zșțăâîĂÂÎȘȚ]+\b", jos)
    if not cuvinte:
        return "bun", motive

    n_en = sum(1 for c in cuvinte if c in CUVINTE_EN)
    n_ro = sum(1 for c in cuvinte if c in CUVINTE_RO)
    are_diacritice = any(c in DIACRITICE for c in text)

    # Engleză: multe cuvinte englezești, nicio urmă de română, fără diacritice
    if n_en >= 3 and n_en > n_ro * 2 and not are_diacritice:
        motive.append(f"engleză ({n_en} cuvinte EN, {n_ro} RO)")
        return "demo", motive

    sedile = [s for s in SEDILE if s in text]
    if sedile:
        motive.append("sedile: " + " ".join(f"{s}→{SEDILE[s]}" for s in sedile))

    gresite = sorted({c for c in cuvinte if c in CUVINTE_FARA_DIACRITICE})
    if gresite:
        motive.append(
            "fără diacritice: "
            + ", ".join(f"{c}→{CUVINTE_FARA_DIACRITICE[c]}" for c in gresite[:6])
        )

    if len(text) > 80 and n_ro >= 2 and not are_diacritice:
        motive.append("text lung românesc fără nicio diacritică")

    return ("de_reparat" if motive else "bun"), motive


def main():
    rezultat = {"demo": [], "de_reparat": [], "bun": 0}
    pe_fisier = Counter()

    for fisier in sorted(f for f in os.listdir(CONTINUT) if f.endswith(".json")):
        if fisier == os.path.basename(IESIRE):
            continue
        date = json.load(open(os.path.join(CONTINUT, fisier), encoding="utf8"))
        texte = []
        aduna(date, texte)

        for cale, brut in texte:
            camp = cale.split(".")[-1].split("[")[0]
            if camp not in CAMPURI:
                continue
            text = curata(brut)
            if len(text) < 20:
                continue

            fel, motive = clasifica(text)
            pe_fisier[(fisier, fel)] += 1
            if fel == "bun":
                rezultat["bun"] += 1
            else:
                rezultat[fel].append(
                    {"fisier": fisier, "cale": cale, "motive": motive,
                     "text": text[:220]}
                )

    with open(IESIRE, "w", encoding="utf8") as f:
        json.dump(rezultat, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{'fișier':26s} {'demo':>6s} {'de reparat':>12s} {'bun':>6s}")
    print("-" * 54)
    fisiere = sorted({f for f, _ in pe_fisier})
    for fisier in fisiere:
        print(f"{fisier[:26]:26s} {pe_fisier[(fisier,'demo')]:6d} "
              f"{pe_fisier[(fisier,'de_reparat')]:12d} {pe_fisier[(fisier,'bun')]:6d}")
    print("-" * 54)
    print(f"{'TOTAL':26s} {len(rezultat['demo']):6d} "
          f"{len(rezultat['de_reparat']):12d} {rezultat['bun']:6d}")

    print("\n--- de reparat (primele 15) ---")
    for element in rezultat["de_reparat"][:15]:
        print(f"\n  {element['fisier']} · {element['cale']}")
        for motiv in element["motive"]:
            print(f"    ! {motiv}")
        print(f"    „{element['text'][:120]}…”")

    print(f"\nRaport complet: continut/texte-triaj.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
