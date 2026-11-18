import { intreaba } from "./baza";
import { cate, forma } from "@/lib/numere-ro";

/**
 * Căutarea peste tot panoul, dintr-un singur câmp.
 *
 * **De ce.** Sună cineva și spune un nume. Până acum trebuia să ghicești în
 * ce listă e: donator? firmă? a trimis un formular de voluntariat? Trei
 * pagini, trei căutări, și tot puteai să ratezi locul unde era.
 *
 * Caută în același timp după nume, e-mail, telefon și CUI. Rezultatele vin
 * grupate, cu câte un link care duce exact la rândul lui — nu la lista în
 * care s-ar putea să fie.
 */

import { type FelGasit } from "@/lib/cautare-grupuri";
export { GRUPURI_CAUTARE, type FelGasit } from "@/lib/cautare-grupuri";

export type Gasit = {
  fel: FelGasit;
  titlu: string;
  detaliu: string;
  unde: string;
};

/** Textul căutat, pregătit pentru `ILIKE`. */
function tipar(text: string): string {
  // `%` și `_` sunt caractere speciale în LIKE: fără escape, cineva care
  // caută „100%" primește toată baza de date.
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function cautaPeste(text: string, limita = 12): Promise<Gasit[]> {
  const q = text.trim();
  if (q.length < 2) return [];
  const ca = tipar(q);

  // Numai cifrele, pentru CUI și telefon: cineva scrie „RO 2816464" sau
  // „0754 510 167", iar în baza de date stau altfel.
  // Fără prefixul de țară și fără zeroul din față: „+40 754 510 167” trebuie
  // să găsească „0754 510 167”. Și fără diacritice: „Stefan” îl găsește pe
  // „Ștefan”, scris cu virgulă sau cu sedilă (`translate` din interogări).
  const cifre = q.replace(/\D/g, "").replace(/^(0040|40|0)(?=\d{6,})/, "");
  const caCifre = cifre.length >= 4 ? `%${cifre}%` : null;

  /*
    Parametrul se trimite ca `$2::text`, nu ca `$2`.

    Când nu sunt destule cifre, valoarea e `null`, iar Postgres nu poate
    deduce tipul unui parametru folosit doar în `IS NOT NULL` și `ILIKE`:
    cade cu „could not determine data type of parameter $2" și căutarea nu
    întoarce nimic — arătând exact ca „n-am găsit nimic".
  */

  const fd = (x: string) => `translate(lower(${x}), 'ăâîșşțţ', 'aaisstt')`;
  const [donatori, firme, cereri, voluntari, contracte, texte, presa] = await Promise.all([
    intreaba<{
      email: string;
      nume: string | null;
      total: string | null;
      cate: string;
    }>(
      `SELECT d.email,
              (ARRAY_AGG(NULLIF(TRIM(CONCAT_WS(' ', d.prenume, d.nume)), '')
                         ORDER BY d.platita_la DESC NULLS LAST))[1] AS nume,
              (SUM(d.suma_bani) FILTER (WHERE d.moneda = 'RON')::numeric / 100)
                AS total,
              COUNT(*) AS cate
         FROM donatii d
        WHERE d.email IS NOT NULL
          AND (translate(lower(d.email), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt')
               OR translate(lower(CONCAT_WS(' ', d.prenume, d.nume)), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt')
               OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(d.telefon,''), '\\D', '', 'g') ILIKE $2::text))
        GROUP BY d.email
        ORDER BY MAX(d.platita_la) DESC NULLS LAST
        LIMIT $3`,
      [ca, caCifre, limita],
    ),
    intreaba<{
      id: string;
      denumire: string;
      cui: string;
      persoana: string;
      stadiu: string;
    }>(
      `SELECT id, denumire, cui, persoana, stadiu
         FROM firme
        WHERE translate(lower(denumire), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt') OR translate(lower(persoana), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt') OR translate(lower(email), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt')
           OR ($2::text IS NOT NULL AND cui ILIKE $2::text)
           OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(telefon,''), '\\D', '', 'g') ILIKE $2::text)
        ORDER BY schimbat_la DESC
        LIMIT $3`,
      [ca, caCifre, limita],
    ),
    intreaba<{
      id: string;
      fel: string;
      nume: string;
      email: string;
      stadiu: string;
    }>(
      `SELECT id, fel, nume, email, stadiu
         FROM cereri
        -- Voluntarii au grupul lor, cu link spre baza de voluntari.
        WHERE fel <> 'voluntariat' AND (translate(lower(nume), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt') OR translate(lower(email), 'ăâîșşțţ', 'aaisstt') LIKE translate(lower($1), 'ăâîșşțţ', 'aaisstt')
           OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(telefon,''), '\\D', '', 'g') ILIKE $2::text))
        ORDER BY creat_la DESC
        LIMIT $3`,
      [ca, caCifre, limita],
    ),
    intreaba<{ id: string; nume: string; email: string; localitate: string | null }>(
      `SELECT id, nume, email, detalii->>'localitate' AS localitate
         FROM cereri
        WHERE fel = 'voluntariat'
          AND (${fd("nume")} LIKE ${fd("$1")} OR ${fd("email")} LIKE ${fd("$1")}
               OR ${fd("COALESCE(detalii->>'localitate','')")} LIKE ${fd("$1")}
               OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(telefon,''), '\\D', '', 'g') ILIKE $2::text))
        ORDER BY creat_la DESC
        LIMIT $3`,
      [ca, caCifre, limita],
    ),
    intreaba<{ id: string; an: number; numar: number; denumire: string; firma_id: string | null; stadiu: string }>(
      `SELECT id, an, numar, denumire, firma_id, stadiu
         FROM contracte
        WHERE ${fd("denumire")} LIKE ${fd("$1")}
           OR ($2::text IS NOT NULL AND COALESCE(cui,'') ILIKE $2::text)
           OR (numar::text || '/' || an::text) LIKE $4
        ORDER BY an DESC, numar DESC
        LIMIT $3`,
      [ca, caCifre, limita, `%${q.replace(/\s+/g, "")}%`],
    ),
    intreaba<{ id: string; fel: string; titlu: string; stare: string }>(
      `SELECT id, fel, titlu, stare
         FROM texte
        WHERE ${fd("titlu")} LIKE ${fd("$1")}
        ORDER BY coalesce(publicat_la, creat_la) DESC
        LIMIT $2`,
      [ca, limita],
    ),
    intreaba<{ id: string; publicatie: string; persoana: string | null; email: string | null }>(
      `SELECT id, publicatie, persoana, email
         FROM contacte_presa
        WHERE ${fd("publicatie")} LIKE ${fd("$1")} OR ${fd("COALESCE(persoana,'')")} LIKE ${fd("$1")}
           OR ${fd("COALESCE(email,'')")} LIKE ${fd("$1")}
        ORDER BY publicatie
        LIMIT $2`,
      [ca, limita],
    ),
  ]);

  const rezultate: Gasit[] = [];

  for (const d of donatori) {
    rezultate.push({
      fel: "donator",
      titlu: d.nume || d.email,
      detaliu: `${d.email} · ${cate(Number(d.cate), "donație", "donații")}${
        d.total ? `, ${Number(d.total).toLocaleString("ro-RO")} lei` : ""
      }`,
      // Lista de donatori caută după e-mail, deci linkul duce fix la el.
      unde: `/admin/donatori?cauta=${encodeURIComponent(d.email)}&deschis=${encodeURIComponent(d.email)}`,
    });
  }

  for (const f of firme) {
    rezultate.push({
      fel: "firma",
      titlu: f.denumire,
      detaliu: `${f.cui.startsWith("fara-cui-") ? "fără CUI" : `CUI ${f.cui}`} · ${f.persoana}`,
      unde: `/admin/firme/${f.id}/mesaje`,
    });
  }

  for (const c of cereri) {
    rezultate.push({
      fel: "cerere",
      titlu: c.nume,
      detaliu: `${c.email} · ${c.fel}`,
      unde: `/admin/cereri?fel=${encodeURIComponent(c.fel)}`,
    });
  }

  const FEL_TEXT: Record<string, string> = { noutate: "Articol", campanie: "Campanie", proiect: "Tabără" };
  for (const v of voluntari) {
    rezultate.push({
      fel: "voluntar",
      titlu: v.nume,
      detaliu: [v.email, v.localitate].filter(Boolean).join(" · "),
      unde: `/admin/voluntari?q=${encodeURIComponent(v.email)}`,
    });
  }
  for (const c of contracte) {
    rezultate.push({
      fel: "contract",
      titlu: `Contractul ${c.numar}/${c.an}`,
      detaliu: `${c.denumire} · ${c.stadiu}`,
      unde: c.firma_id ? `/admin/firme/${c.firma_id}/mesaje` : `/admin/contracte?an=${c.an}`,
    });
  }
  for (const t of texte) {
    rezultate.push({
      fel: "text",
      titlu: t.titlu,
      detaliu: `${FEL_TEXT[t.fel] ?? t.fel} · ${t.stare === "publicat" ? "publicat" : "nepublicat"}`,
      unde: `/admin/scrie/${t.id}`,
    });
  }
  for (const r of presa) {
    rezultate.push({
      fel: "presa",
      titlu: r.publicatie,
      detaliu: [r.persoana, r.email].filter(Boolean).join(" · ") || "fără contact",
      unde: `/admin/presa#redactii`,
    });
  }
  return rezultate;
}
