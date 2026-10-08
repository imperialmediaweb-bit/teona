/**
 * Adresele vechi ale proiectelor, `/portfolio/<slug>`, perechi cu cele noi.
 *
 * Se calculează la pornirea `next.config.ts`, deci în Node: putem citi
 * fișierele din `continut/`. Rezultatul intră în lista de redirecționări a lui
 * Next, ca fiecare adresă veche să răspundă cu un 301 adevărat.
 *
 * Varianta cu o pagină-captură (`/portfolio/[...slug]` care face
 * `permanentRedirect`) nu e bună aici: cu Cache Components, ruta răspunde 200
 * și mută navigarea în browser. Pentru un om e același lucru, dar Google vede
 * o pagină, nu o mutare — și adresa veche nu-și cedează poziția celei noi.
 *
 * Slugurile vechi conțin emoji procent-codate. Aici sunt decodate: Next
 * potrivește `source` pe calea decodată.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LUNI_IGNORATE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

function curataTitlu(titlu) {
  return titlu
    .replace(LUNI_IGNORATE, " ")
    .replace(/\s*-\s*Asociatia Teona Ariana\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function faSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ș|ş/g, "s")
    .replace(/ț|ţ/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

export function redirectionariProiecte() {
  const brut = JSON.parse(
    readFileSync(join(process.cwd(), "continut", "proiecte.json"), "utf8"),
  );

  const folosite = new Set();
  const reguli = [];

  // Aceeași ordine ca în `src/date/proiecte.ts`, ca slugurile noi să iasă
  // identice. Dacă una dintre ele se schimbă, se schimbă amândouă.
  for (const proiect of brut) {
    const titlu = curataTitlu(proiect.titlu);
    const data = proiect.data.slice(0, 10);

    let slugNou = faSlug(titlu);
    if (folosite.has(slugNou)) slugNou = `${slugNou}-${data}`;
    folosite.add(slugNou);

    const bucati = proiect.adresa.replace(/\/+$/, "").split("/");
    let slugVechi = bucati[bucati.length - 1] ?? "";
    try {
      slugVechi = decodeURIComponent(slugVechi);
    } catch {
      // Slug cu procente nevalide: îl lăsăm cum e.
    }
    if (!slugVechi) continue;

    // Emoji din slugul vechi -> un parametru.
    //
    // Next construiește expresia de potrivire fără steagul `u`, așa că un
    // emoji scris literal în `source` nu se potrivește niciodată: regula ar
    // fi moartă, iar adresa ar cădea pe regula generală. Un parametru
    // (`:e0`) potrivește și forma codată (`%f0%9f%a7%a1`), și pe cea
    // decodată, oricum ar trimite-o browserul.
    let n = 0;
    const sursa = slugVechi
      .replace(LUNI_IGNORATE, "\u0000")
      .replace(/\u0000+/g, () => `:e${n++}`);

    reguli.push({
      de_la: `/portfolio/${sursa}`,
      la: `/proiecte/${slugNou}`,
    });
  }

  return reguli;
}
