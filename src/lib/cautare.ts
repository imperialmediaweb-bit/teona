import { intreaba } from "./baza";

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

export type Gasit = {
  fel: "donator" | "firma" | "cerere";
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

export async function cautaPeste(text: string): Promise<Gasit[]> {
  const q = text.trim();
  if (q.length < 2) return [];
  const ca = tipar(q);

  // Numai cifrele, pentru CUI și telefon: cineva scrie „RO 2816464" sau
  // „0754 510 167", iar în baza de date stau altfel.
  const cifre = q.replace(/\D/g, "");
  const caCifre = cifre.length >= 4 ? `%${cifre}%` : null;

  /*
    Parametrul se trimite ca `$2::text`, nu ca `$2`.

    Când nu sunt destule cifre, valoarea e `null`, iar Postgres nu poate
    deduce tipul unui parametru folosit doar în `IS NOT NULL` și `ILIKE`:
    cade cu „could not determine data type of parameter $2" și căutarea nu
    întoarce nimic — arătând exact ca „n-am găsit nimic".
  */

  const [donatori, firme, cereri] = await Promise.all([
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
          AND (d.email ILIKE $1
               OR CONCAT_WS(' ', d.prenume, d.nume) ILIKE $1
               OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(d.telefon,''), '\\D', '', 'g') ILIKE $2::text))
        GROUP BY d.email
        ORDER BY MAX(d.platita_la) DESC NULLS LAST
        LIMIT 12`,
      [ca, caCifre],
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
        WHERE denumire ILIKE $1 OR persoana ILIKE $1 OR email ILIKE $1
           OR ($2::text IS NOT NULL AND cui ILIKE $2::text)
           OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(telefon,''), '\\D', '', 'g') ILIKE $2::text)
        ORDER BY schimbat_la DESC
        LIMIT 12`,
      [ca, caCifre],
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
        WHERE nume ILIKE $1 OR email ILIKE $1
           OR ($2::text IS NOT NULL AND regexp_replace(COALESCE(telefon,''), '\\D', '', 'g') ILIKE $2::text)
        ORDER BY creat_la DESC
        LIMIT 12`,
      [ca, caCifre],
    ),
  ]);

  const rezultate: Gasit[] = [];

  for (const d of donatori) {
    rezultate.push({
      fel: "donator",
      titlu: d.nume || d.email,
      detaliu: `${d.email} · ${d.cate} ${Number(d.cate) === 1 ? "donație" : "donații"}${
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
      detaliu: `CUI ${f.cui} · ${f.persoana}`,
      unde: `/admin/firme?cauta=${encodeURIComponent(f.denumire)}`,
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

  return rezultate;
}
