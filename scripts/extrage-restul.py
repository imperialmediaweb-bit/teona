"""Scoate si restul conturilor: meniul, antetul/subsolul, formularele, sponsorii."""
import re, json, html, os

x = open("export-wordpress.xml", encoding="utf-8").read()
items = re.findall(r"<item>(.*?)</item>", x, re.S)

def cd(s):
    m = re.search(r"<!\[CDATA\[(.*?)\]\]>", s, re.S)
    return m.group(1) if m else html.unescape((s or "").strip())

def camp(it, tag):
    m = re.search(rf"<{tag}>(.*?)</{tag}>", it, re.S)
    return cd(m.group(1)) if m else None

def meta(it):
    return {cd(k): cd(v) for k, v in re.findall(
        r"<wp:postmeta>\s*<wp:meta_key>(.*?)</wp:meta_key>\s*<wp:meta_value>(.*?)</wp:meta_value>\s*</wp:postmeta>",
        it, re.S)}

def curat(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t or "")).strip()

# ---------- 1. meniul ----------
brut = []
for it in items:
    if camp(it, "wp:post_type") != "nav_menu_item": continue
    m = meta(it)
    brut.append({
        "id": camp(it, "wp:post_id"),
        "titlu": camp(it, "title") or "",
        "tip": m.get("_menu_item_type"),
        "obiect": m.get("_menu_item_object"),
        "obiectId": m.get("_menu_item_object_id"),
        "parinte": m.get("_menu_item_menu_item_parent", "0"),
        "ordine": int(camp(it, "wp:menu_order") or 0),
        "adresa": m.get("_menu_item_url") or "",
    })
# titlul lipseste la elementele legate de o pagina: il luam de la pagina
titluri = {camp(it, "wp:post_id"): camp(it, "title") for it in items}
adrese = {camp(it, "wp:post_id"): camp(it, "link") for it in items}
for e in brut:
    if not e["titlu"] and e["obiectId"]:
        e["titlu"] = titluri.get(e["obiectId"], "")
    if not e["adresa"] and e["obiectId"]:
        e["adresa"] = adrese.get(e["obiectId"], "")

def arbore(parinte="0"):
    return [{**e, "copii": arbore(e["id"])}
            for e in sorted((y for y in brut if y["parinte"] == parinte),
                            key=lambda z: z["ordine"])]
meniu = arbore()

# ---------- 2. antet si subsol ----------
def texte(arb):
    out = []
    def w(n):
        for el in n if isinstance(n, list) else []:
            st = el.get("settings") or {}
            for k, v in st.items():
                if isinstance(v, str) and v.strip() and not k.startswith(("_", "typo")):
                    t = curat(v)
                    if len(t) > 2 and not re.match(r"^(#|\d|rgba?\(|solid|left|right|center)", t):
                        out.append({"camp": k, "text": t[:300]})
                elif isinstance(v, dict) and isinstance(v.get("url"), str) and v["url"]:
                    out.append({"camp": k, "adresa": v["url"]})
                elif isinstance(v, list):
                    for r in v:
                        if not isinstance(r, dict): continue
                        for k2, v2 in r.items():
                            if isinstance(v2, str) and v2.strip() and not k2.startswith("_"):
                                out.append({"camp": f"{k}[].{k2}", "text": curat(v2)[:200]})
                            elif isinstance(v2, dict) and isinstance(v2.get("url"), str) and v2["url"]:
                                out.append({"camp": f"{k}[].{k2}", "adresa": v2["url"]})
            w(el.get("elements") or [])
    w(arb)
    return out

sabloane = []
for it in items:
    tip = camp(it, "wp:post_type")
    if tip not in ("header", "footer"): continue
    el = meta(it).get("_elementor_data")
    try: arb = json.loads(el) if el else []
    except Exception: arb = []
    sabloane.append({"tip": tip, "id": camp(it, "wp:post_id"),
                     "titlu": camp(it, "title"), "continut": texte(arb)})

# ---------- 3. formularele de donatie ----------
formulare = []
for it in items:
    if camp(it, "wp:post_type") != "give_forms": continue
    if camp(it, "wp:status") != "publish": continue
    m = meta(it)
    niveluri = []
    for k, v in sorted(m.items()):
        g = re.match(r"_give_donation_levels_(\d+)_(\w+)", k)
        if g:
            i = int(g.group(1))
            while len(niveluri) <= i: niveluri.append({})
            niveluri[i][g.group(2)] = v
    formulare.append({
        "id": camp(it, "wp:post_id"), "titlu": camp(it, "title"),
        "slug": camp(it, "wp:post_name"), "adresa": camp(it, "link"),
        "continut": curat(camp(it, "content:encoded")),
        "tipPret": m.get("_give_price_option"),
        "sumaImplicita": m.get("_give_default_gateway"),
        "niveluri": [n for n in niveluri if n],
        "obiectiv": m.get("_give_goal_option"),
        "sumaObiectiv": m.get("_give_set_goal"),
    })

# ---------- 4. sponsorii ----------
sponsori = []
for it in items:
    el = meta(it).get("_elementor_data")
    if not el or "risehand-client-carousel-v1" not in el: continue
    try: arb = json.loads(el)
    except Exception: continue
    def w(n):
        for e2 in n:
            if e2.get("widgetType") == "risehand-client-carousel-v1":
                for r in (e2.get("settings") or {}).get("client_repeater") or []:
                    img = (r.get("brand_image") or {}).get("url", "")
                    lk = r.get("brand_link")
                    lk = (lk.get("url") if isinstance(lk, dict) else lk) or ""
                    if img: sponsori.append({"imagine": img, "adresa": lk})
            w(e2.get("elements") or [])
    w(arb)
vazut, unici = set(), []
for s in sponsori:
    if s["imagine"] in vazut: continue
    vazut.add(s["imagine"]); unici.append(s)

d = "../continut"
for nume, date in [("meniu", meniu), ("antet-subsol", sabloane),
                   ("formulare-donatii", formulare), ("sponsori", unici)]:
    json.dump(date, open(f"{d}/{nume}.json", "w"), ensure_ascii=False, indent=1)
    n = len(date)
    print(f"  {nume+'.json':24} {n:3} intrari")
print(f"\nmeniu: {sum(1 for _ in brut)} elemente, {len(meniu)} de nivel 1")
print(f"sponsori distincti: {len(unici)} | cu adresa pusa: {sum(1 for s in unici if s['adresa'])}")
