#!/usr/bin/env python3
"""Scoate, pentru fiecare pagină din WordPress, pozele reale folosite pe ea.

Produce `continut/poze-pagini.json`. Trei lucruri se întâmplă aici:

1. Pozele demo ale temei Risehand (găzduite pe themepanthers.com) și
   `placeholder.png` al Elementorului sunt scoase. Caietul de sarcini cere
   eliminarea imaginilor demo, și oricum nu au fost descărcate.
2. Miniaturile generate de WordPress (`poza-768x363.jpg`) sunt reduse la
   originalul lor (`poza.jpg`). Next.js își generează singur mărimile.
3. Ordinea e cea din arborele Elementor, nu alfabetică — adică ordinea în care
   pozele apăreau efectiv pe pagină.

Rulare:  python3 scripts/mapeaza-poze.py
"""

import json
import os
import re
import sys

RADACINA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(RADACINA, "scripts", "export-wordpress.xml")
PAGINI = os.path.join(RADACINA, "continut", "pagini.json")
MEDIA = os.path.join(RADACINA, "continut", "media.json")
IESIRE = os.path.join(RADACINA, "continut", "poze-pagini.json")

EXTENSII = r"jpe?g|png|webp|gif|svg"
DEMO = ("themepanthers.com", "placeholder.png", "woocommerce-placeholder")


def cale_relativa(url):
    """`…/wp-content/uploads/2024/11/poza.jpg` -> `2024/11/poza.jpg`, sau None."""
    m = re.search(r"/wp-content/uploads/(\d{4}/\d{2}/[^/?#\"']+)", url)
    return m.group(1) if m else None


def fara_miniatura(rel):
    """Taie sufixul de mărime pus de WordPress: `poza-768x363.jpg` -> `poza.jpg`."""
    return re.sub(rf"-\d+x\d+(\.(?:{EXTENSII}))$", r"\1", rel, flags=re.I)


def indexeaza_variantele():
    """
    {cale fără sufixul de mărime: cea mai mare variantă existentă pe disc}

    Descărcarea n-a adus originalul pentru toate pozele: 128 dintre ele există
    doar ca miniaturi WordPress, de obicei la 1024 px — destul pentru web.
    Fără indexul ăsta le-am fi pierdut pe toate, pentru că adresa din pagină
    trimite la un original care nu e pe disc.
    """
    index = {}
    radacina = os.path.join(RADACINA, "public", "poze")
    for dirpath, _, fisiere in os.walk(radacina):
        for nume in fisiere:
            cale = os.path.relpath(os.path.join(dirpath, nume), radacina).replace(
                os.sep, "/"
            )
            cheie = fara_miniatura(cale)
            m = re.search(r"-(\d+)x(\d+)\.[a-z0-9]+$", cale, re.I)
            # Originalul bate orice miniatură; între miniaturi câștigă cea mare.
            marime = 0 if m is None else -int(m.group(1)) * int(m.group(2))
            precedent = index.get(cheie)
            if precedent is None or marime < precedent[0]:
                index[cheie] = (marime, cale)
    return {cheie: cale for cheie, (_, cale) in index.items()}


def e_demo(url):
    return any(semn in url for semn in DEMO)


def urluri_in_ordine(elementor_json):
    """Toate URL-urile de imagine din arborele Elementor, în ordinea din arbore."""
    gasite = []

    def mergi(nod):
        if isinstance(nod, dict):
            # Un câmp de imagine Elementor e {"url": …, "id": …, "alt": …}
            url = nod.get("url")
            if isinstance(url, str) and re.search(rf"\.(?:{EXTENSII})(?:\?|$)", url, re.I):
                gasite.append(url)
            for valoare in nod.values():
                mergi(valoare)
        elif isinstance(nod, list):
            for element in nod:
                mergi(element)
        elif isinstance(nod, str):
            for m in re.finditer(rf"https?://[^\s\"'<>]+?\.(?:{EXTENSII})", nod, re.I):
                gasite.append(m.group(0))

    mergi(elementor_json)
    return gasite


def elementor_pe_titlu(xml):
    """{titlu pagină: arbore Elementor} — citit o dată, din exportul brut."""
    harta = {}
    for m in re.finditer(r"<title>(.*?)</title>", xml, re.S):
        titlu = m.group(1).strip()
        if titlu.startswith("<![CDATA["):
            titlu = titlu[9:-3].strip()
        if not titlu:
            continue
        # `_elementor_data` al acestui element, până la următorul <item>
        inceput = m.end()
        sfarsit = xml.find("<item>", inceput)
        bucata = xml[inceput : sfarsit if sfarsit != -1 else inceput + 600_000]
        poz = bucata.find("_elementor_data")
        if poz == -1:
            continue
        a = bucata.find("CDATA[", poz)
        if a == -1:
            continue
        a += 6
        b = bucata.find("]]>", a)
        try:
            harta[titlu] = json.loads(bucata[a:b])
        except json.JSONDecodeError:
            continue
    return harta


def main():
    for cale in (EXPORT, PAGINI, MEDIA):
        if not os.path.exists(cale):
            sys.exit(f"lipsește {cale}")

    xml = open(EXPORT, encoding="utf8").read()
    pagini = json.load(open(PAGINI, encoding="utf8"))
    media = json.load(open(MEDIA, encoding="utf8"))

    # Textul alternativ, pe cale relativă, din biblioteca media
    alt_pe_cale = {}
    for fisier in media:
        rel = cale_relativa(fisier.get("fisier") or "")
        if rel:
            alt_pe_cale[fara_miniatura(rel)] = (fisier.get("alt") or "").strip()

    variante = indexeaza_variantele()
    arbori = elementor_pe_titlu(xml)
    rezultat = {}
    raport = []

    for pagina in pagini:
        slug, titlu = pagina["slug"], pagina["titlu"]
        # Ordinea din arborele Elementor întâi, pentru pozele puse direct în
        # pagină. Pe urmă restul din pagini.json: pagini ca Proiecte își aduc
        # pozele prin widgeturi dinamice, care nu conțin URL-uri literale.
        surse = urluri_in_ordine(arbori.get(titlu, [])) + pagina["poze"]

        poze, vazute, sarite_demo = [], set(), 0
        for url in surse:
            if e_demo(url):
                sarite_demo += 1
                continue
            rel = cale_relativa(url)
            if not rel:
                continue
            cheie = fara_miniatura(rel)
            if cheie in vazute:
                continue
            # Originalul dacă îl avem, altfel cea mai mare variantă de pe disc.
            pe_disc = variante.get(cheie)
            if pe_disc is None:
                continue
            vazute.add(cheie)
            poze.append(
                {"cale": f"/poze/{pe_disc}", "alt": alt_pe_cale.get(cheie, "")}
            )

        if poze or sarite_demo:
            rezultat[slug] = poze
            raport.append((slug, len(poze), sarite_demo))

    with open(IESIRE, "w", encoding="utf8") as f:
        json.dump(rezultat, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{'pagină':34s} {'poze reale':>10s} {'demo sărite':>12s}")
    for slug, n, demo in sorted(raport, key=lambda r: -r[1]):
        print(f"{slug[:34]:34s} {n:10d} {demo:12d}")
    total = sum(n for _, n, _ in raport)
    fara_alt = sum(1 for p in rezultat.values() for poza in p if not poza["alt"])
    print(f"\n{total} poze pe {len(rezultat)} pagini -> continut/poze-pagini.json")
    print(f"{fara_alt} dintre ele n-au text alternativ în biblioteca media.")


if __name__ == "__main__":
    main()
