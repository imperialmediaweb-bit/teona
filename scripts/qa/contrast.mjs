import { browser, BAZA } from "./comun.mjs";

/**
 * Contrastul textului față de fundal, pe toate paginile publice.
 *
 * Pragurile sunt cele din WCAG 2.1 AA: 4,5:1 pentru text obișnuit, 3:1 pentru
 * text mare (de la 24px, sau de la 18,66px dacă e îngroșat). Sub ele, textul
 * nu se mai citește pe un telefon ținut în soare sau de cineva cu vederea
 * slăbită — adică exact publicul unei asociații de copii cu dizabilități și
 * al părinților lor.
 *
 * **De ce măsoară în browser, nu în cod.** Culoarea finală a unui text depinde
 * de ce e sub el: fundaluri translucide puse unul peste altul, degradeuri,
 * clase care se bat între ele. Un script care citește clasele din JSX ar
 * trebui să reconstruiască tot CSS-ul ca să ghicească; browserul știe deja.
 *
 * Trei lucruri pe care le face corect, și fără de care ieșeau alarme false:
 *
 * - **compune transparențele.** `bg-hartie/70` peste `bg-caramiziu-100` nu e
 *   niciuna dintre ele; se amestecă, în ordine, până la primul fundal opac;
 * - **ia degradeul în serios.** Un element cu `bg-gradient-to-br` n-are
 *   `background-color`; are stopuri. Se calculează contrastul față de fiecare
 *   și se păstrează cel mai prost — dacă textul e lizibil doar pe jumătate din
 *   buton, nu e lizibil;
 * - **sare peste ce nu se vede.** `aria-hidden`, `sr-only`, elemente de
 *   mărime zero, text alb pe text alb din animații care încă n-au pornit.
 *
 * Ce NU poate: text așezat direct peste o fotografie. Acolo contrastul depinde
 * de poză, nu de CSS. Elementele astea sunt numărate separat, ca să se știe
 * câte sunt, dar nu pică proba.
 */

const PAGINI = [
  "/",
  "/despre-noi",
  "/casa-teona",
  "/proiecte",
  "/doneaza",
  "/redirectioneaza-3-5",
  "/directioneaza-20",
  "/devino-voluntar",
  "/contact",
  "/sponsori-si-parteneri",
  "/doneaza-ti-ziua",
  "/suntem-in-presa",
];

const MASURA = () => {
  // ─── Culori ─────────────────────────────────────────────────────────────
  /*
    Culorile se citesc printr-o pânză de 1×1 pixel, nu cu o expresie regulată.

    Tailwind 4 nu mai scrie `rgb(...)`. Temele sunt în `oklch`, iar
    transparențele („text-hartie/80”) ies din browser ca
    `color-mix(in oklab, …)` sau `color(srgb 0.07 0.03 0.015 / 0.8)` — cu
    valori între 0 și 1, nu între 0 și 255. Prima versiune a probei citea
    numerele în ordine și lua 0.07 drept „7 roșu”, deci vedea text aproape
    negru peste tot: 617 alarme, toate false.

    Pânza nu ghicește: desenează culoarea așa cum ar desena-o pagina și o
    citește înapoi în octeți. Merge pentru orice notație, inclusiv pentru
    cele care vor apărea anul viitor.
  */
  const panza = document.createElement("canvas");
  panza.width = panza.height = 1;
  const creion = panza.getContext("2d", { willReadFrequently: true });

  const citesteCuloare = (text) => {
    if (!text || text === "transparent" || text === "none") return null;
    // `fillStyle` păstrează valoarea veche dacă textul nu e o culoare validă.
    // Punem două străji diferite: dacă amândouă rămân neschimbate, culoarea
    // n-a fost înțeleasă.
    creion.fillStyle = "#000000";
    creion.fillStyle = text;
    const incercare1 = creion.fillStyle;
    creion.fillStyle = "#ffffff";
    creion.fillStyle = text;
    if (incercare1 === "#000000" && creion.fillStyle === "#ffffff") return null;

    creion.clearRect(0, 0, 1, 1);
    creion.fillStyle = text;
    creion.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = creion.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };

  const peste = (sus, jos) => ({
    r: sus.r * sus.a + jos.r * (1 - sus.a),
    g: sus.g * sus.a + jos.g * (1 - sus.a),
    b: sus.b * sus.a + jos.b * (1 - sus.a),
    a: 1,
  });

  const luminanta = ({ r, g, b }) => {
    const c = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
  };

  const raport = (x, y) => {
    const a = luminanta(x);
    const b = luminanta(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  /** Stopurile de culoare dintr-un `background-image` cu degradeu. */
  const stopuri = (imagine) => {
    if (!imagine || !imagine.includes("gradient")) return [];
    // Orice notație de culoare, nu doar `rgb()`: degradeurile din Tailwind 4
    // au stopurile în `oklab`/`color-mix`.
    const bucati =
      imagine.match(
        /(?:rgba?|hsla?|okl(?:ch|ab)|lab|lch|color|color-mix)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-f]{3,8}\b/gi,
      ) ?? [];
    return bucati
      .map((b) => citesteCuloare(b))
      .filter((c) => c && c.a > 0.5);
  };

  /**
   * Fundalurile posibile ale unui element: se urcă în părinți, compunând
   * transparențele, până la primul fundal opac. Întoarce mai multe culori
   * dacă pe drum s-a întâlnit un degradeu.
   */
  const fundaluri = (el) => {
    let acumulate = [{ r: 255, g: 255, b: 255, a: 0 }];
    let nod = el;
    while (nod && nod !== document.documentElement.parentElement) {
      const s = getComputedStyle(nod);
      const grad = stopuri(s.backgroundImage);
      const culori = grad.length ? grad : [citesteCuloare(s.backgroundColor)];
      for (const c of culori) {
        if (!c || c.a === 0) continue;
        if (grad.length) {
          // Degradeu: fiecare stop e o variantă de fundal de la care în jos
          // nu mai contează ce e dedesubt (stopurile sunt opace).
          return acumulate.flatMap((peste_) =>
            culori.map((stop) => (peste_.a === 0 ? stop : peste(peste_, stop))),
          );
        }
        acumulate = acumulate.map((a) => (a.a === 0 ? c : peste(a, c)));
        if (acumulate.every((a) => a.a === 1)) return acumulate;
      }
      nod = nod.parentElement;
    }
    // Nimic opac până sus: fundalul paginii.
    return acumulate.map((a) =>
      a.a === 1 ? a : peste(a, { r: 255, g: 255, b: 255, a: 1 }),
    );
  };

  const arePozaDedesubt = (el) => {
    let nod = el;
    while (nod && nod !== document.body) {
      const s = getComputedStyle(nod);
      if (s.backgroundImage.includes("url(")) return true;
      if (
        [...nod.children].some(
          (c) =>
            c.tagName === "IMG" &&
            ["absolute", "fixed"].includes(getComputedStyle(c).position),
        )
      )
        return true;
      nod = nod.parentElement;
    }
    return false;
  };

  const rele = [];
  let pePoza = 0;

  for (const el of document.querySelectorAll("body *")) {
    // Doar elementele cu text propriu, nu containerele.
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join("")
      .trim();
    if (!text) continue;
    if (el.closest("[aria-hidden='true']")) continue;

    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0)
      continue;
    const cutie = el.getBoundingClientRect();
    if (cutie.width < 2 || cutie.height < 2) continue;
    // `sr-only`: 1px, decupat. Nu se vede, deci nu se măsoară.
    if (cutie.width <= 2 && cutie.height <= 2) continue;

    const fg = citesteCuloare(s.color);
    if (!fg || fg.a === 0) continue;

    if (arePozaDedesubt(el)) {
      pePoza++;
      continue;
    }

    const marime = parseFloat(s.fontSize);
    const gros = parseInt(s.fontWeight, 10) || 400;
    const mare = marime >= 24 || (marime >= 18.66 && gros >= 700);
    const prag = mare ? 3 : 4.5;

    const posibile = fundaluri(el);
    const fgOpac = fg.a < 1 ? peste(fg, posibile[0]) : fg;
    const celMaiProst = Math.min(...posibile.map((b) => raport(fgOpac, b)));

    if (celMaiProst < prag - 0.005) {
      const vinovat = posibile
        .map((b) => ({ b, r: raport(fgOpac, b) }))
        .sort((x, y) => x.r - y.r)[0].b;
      const hex = (c) =>
        "#" +
        [c.r, c.g, c.b]
          .map((v) => Math.round(v).toString(16).padStart(2, "0"))
          .join("");
      rele.push({
        text: text.slice(0, 40),
        etichetă: el.tagName.toLowerCase(),
        clase: (el.className?.toString?.() ?? "").slice(0, 70),
        fg: hex(fgOpac),
        bg: hex(vinovat),
        raport: +celMaiProst.toFixed(2),
        prag,
        marime: `${Math.round(marime)}px/${gros}`,
      });
    }
  }
  return { rele, pePoza };
};

const b = await browser();
const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

let total = 0;
let totalPePoza = 0;
const unice = new Map();

for (const cale of PAGINI) {
  await page.goto(BAZA + cale, { waitUntil: "networkidle" });
  // Animațiile de intrare schimbă opacitatea; le lăsăm să se termine.
  await page.waitForTimeout(1200);
  const { rele, pePoza } = await page.evaluate(MASURA);
  totalPePoza += pePoza;
  if (rele.length) {
    console.log(`\n${cale}: ${rele.length}`);
    for (const r of rele) {
      console.log(
        `  ✗ ${r.raport}:1 (prag ${r.prag}) ${r.fg} pe ${r.bg} · ${r.marime} · <${r.etichetă}> „${r.text}"`,
      );
      const cheie = `${r.fg}|${r.bg}|${r.prag}`;
      unice.set(cheie, (unice.get(cheie) ?? 0) + 1);
    }
    total += rele.length;
  } else {
    console.log(`${cale}: ok`);
  }
}

await b.close();

if (unice.size) {
  console.log("\n— perechi de culori, după câte locuri ating —");
  for (const [cheie, n] of [...unice].sort((a, b) => b[1] - a[1])) {
    const [fg, bg, prag] = cheie.split("|");
    console.log(`  ${n}× ${fg} pe ${bg} (prag ${prag})`);
  }
}
console.log(
  `\nlocuri sub prag: ${total} · text peste fotografie (nemăsurabil): ${totalPePoza}`,
);
process.exit(total ? 1 : 0);
