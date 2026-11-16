import { createHmac } from "node:crypto";
import { intreaba } from "@/lib/baza";
import { cheiaDeSemnat, semnaturaLinkuluiTine, semneazaText } from "@/lib/cheie-semnare";
import { curataHtml } from "@/lib/curata-html";
import { textSimplu } from "@/lib/text-bogat";
import { adresaDeLa, trimiteEmailCuId } from "@/lib/email/trimite";
import { scrieInteractiune, type Firma } from "@/lib/crm";
import { mediu } from "@/lib/mediu";
import { ASOCIATIA, EMAIL, TELEFOANE } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";
import { pozaPentruEmail } from "@/lib/cloudinary-listare";
import type { Text } from "@/lib/texte";

/**
 * E-mailurile cu firmele, scrise și citite din panou.
 *
 * Fundraiserul, noiembrie 2026: să scrie fiecărei firme în parte, cu poze și
 * atașamente (prezentarea, contractul), să vadă dacă l-a deschis și să-i
 * vadă răspunsul, tot acolo, cu atașamentele lui.
 *
 * **Nu prin MailerLite.** MailerLite trimite campanii către liste și nu pune
 * atașamente. Aici pleacă prin Resend, ca mulțumirile: un mesaj, o firmă.
 * Trimiterea „la mai multe firme” e tot câte unul (fiecare cu numele lui),
 * cel mult 30 o dată și sub `LIMITA_MASA` — nu e un buletin.
 *
 * **Răspunsurile** vin pe o adresă a firmei, pe subdomeniul din
 * `RASPUNS_DOMENIU` (de ex. `raspuns.teona-ariana.ro`, cu MX-ul la Resend):
 * `firma-<id>-<semn>@…`. Semnul ține pe cineva să scrie în discuția altei
 * firme ghicind adresa. Fără variabilă, răspunsul merge la adresa celui care
 * a scris (sau contact@), ca până acum, și nu apare în panou.
 */

export const LIMITA_LOT = 30;

export type Atasament = { id: string; nume: string; tip: string; marime: number };

export type Mesaj = {
  id: string;
  directie: "trimis" | "primit";
  deLa: string;
  catre: string;
  subiect: string;
  html: string;
  text: string;
  trimisDe: string | null;
  creatLa: string;
  livratLa: string | null;
  deschisLa: string | null;
  deschideri: number;
  clicLa: string | null;
  clicuri: number;
  ultimulLink: string | null;
  respins: string | null;
  citit: boolean;
  atasamente: Atasament[];
};

/* ── Adresa de răspuns ─────────────────────────────────────────────── */

function semn(id: string): string | null {
  const c = cheiaDeSemnat();
  return c ? createHmac("sha256", c).update(`raspuns-firma:${id}`).digest("hex").slice(0, 10) : null;
}

export function domeniuRaspuns(): string | null {
  const d = mediu("RASPUNS_DOMENIU")?.toLowerCase();
  return d && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d) ? d : null;
}

export function adresaDeRaspuns(firmaId: string): string | null {
  const d = domeniuRaspuns();
  const s = semn(firmaId);
  return d && s ? `firma-${firmaId.replace(/-/g, "")}-${s}@${d}` : null;
}

/** Firma din adresa de răspuns, dacă semnul ține. */
export function firmaDinAdresa(adresa: string): string | null {
  const m = adresa.toLowerCase().match(/firma-([0-9a-f]{32})-([0-9a-f]{10})@/);
  if (!m) return null;
  const h = m[1];
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  return semn(id) === m[2] ? id : null;
}

/* ── Corpul e-mailului ─────────────────────────────────────────────── */

const FONT = "Arial,Helvetica,sans-serif";

function scapa(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** {firma} și {persoana} din text, înlocuite cu datele firmei. */
export function personalizeaza(text: string, f: Pick<Firma, "denumire" | "persoana">, html: boolean): string {
  const s = html ? scapa : (x: string) => x;
  return text.replace(/\{firma\}/gi, s(f.denumire)).replace(/\{persoan[aă]\}/gi, s(f.persoana));
}

/**
 * Un e-mail simplu, ca de la un om: textul, apoi semnătura. Fără bandă și
 * fără butoane — e o scrisoare către o firmă, nu un buletin.
 */
/* ── „Nu mai doresc mesaje” ─────────────────────────────────────────── */

/**
 * Linkul cu care o firmă spune că nu mai vrea e-mailuri din panou. Semnat,
 * ca nimeni să nu poată opri altă firmă ghicind adresa. Duce la o pagină cu
 * buton (scanerele de e-mail deschid toate linkurile), iar antetul
 * `List-Unsubscribe` duce la ruta care primește apăsarea dintr-un clic a lui
 * Gmail și Outlook. O firmă care poate spune ușor „nu” nu mai apasă „spam”.
 */
export function linkRefuz(firmaId: string, pentruAntet = false): string | null {
  const s = semneazaText(`refuz-firma:${firmaId}`);
  if (!s) return null;
  const q = `f=${firmaId}&s=${s}`;
  return pentruAntet ? `${ADRESA_SITE}/api/firme/nu-mai-scrie?${q}` : `${ADRESA_SITE}/nu-mai-scrie?${q}`;
}

export function refuzValid(firmaId: string, semnul: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(firmaId) && /^[0-9a-f]{64}$/.test(semnul) && semnaturaLinkuluiTine(`refuz-firma:${firmaId}`, semnul);
}

/**
 * Butonul „Da, ne interesează” din e-mail: duce la o pagină cu buton (ca la
 * refuz), iar apăsarea anunță asociația și mută lead-ul la „Cerere nouă”.
 */
export function linkInteres(firmaId: string): string | null {
  const s = semneazaText(`interes-firma:${firmaId}`);
  return s ? `${ADRESA_SITE}/raspuns-firma?f=${firmaId}&s=${s}` : null;
}

export function interesValid(firmaId: string, semnul: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(firmaId) && /^[0-9a-f]{64}$/.test(semnul) && semnaturaLinkuluiTine(`interes-firma:${firmaId}`, semnul);
}

/** Firma a apăsat „Da”. Întoarce `true` dacă e prima dată în ultimele 24 de ore. */
export async function firmaInteresata(firmaId: string): Promise<boolean> {
  const [deja] = await intreaba<{ nr: string }>(
    `SELECT count(*) AS nr FROM interactiuni WHERE firma_id = $1 AND rezumat LIKE 'A apăsat „Da, ne interesează”%' AND cand > now() - interval '1 day'`,
    [firmaId],
  );
  if (Number(deja?.nr ?? 0) > 0) return false;
  await intreaba(`UPDATE firme SET stadiu = 'cerere', schimbat_la = now() WHERE id = $1 AND stadiu = 'prospect'`, [firmaId]);
  await scrieInteractiune({
    firmaId,
    fel: "email",
    rezumat: "A apăsat „Da, ne interesează” în e-mail. Sună-i sau trimite-le contractul.",
    scrisDe: "firma, din e-mail",
  }).catch(() => false);
  return true;
}

/**
 * „Nu mai doresc mesaje” de pe pagina generală `/nu-mai-doresc`: adresa
 * intră în `adrese_oprite`, iar fișele de firmă cu adresa asta se opresc.
 * Întoarce numele firmelor oprite acum (pentru anunț) și dacă e prima dată.
 */
export async function opresteAdresa(email: string): Promise<{ nou: boolean; firme: string[] }> {
  const nou = await intreaba<{ email: string }>(
    `INSERT INTO adrese_oprite (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING email`,
    [email.toLowerCase()],
  );
  const firme = await intreaba<{ id: string; denumire: string }>(
    `UPDATE firme SET fara_emailuri_la = now()
      WHERE fara_emailuri_la IS NULL AND lower(email) = $1 RETURNING id, denumire`,
    [email.toLowerCase()],
  );
  for (const f of firme) {
    await scrieInteractiune({
      firmaId: f.id,
      fel: "notita",
      rezumat: "Nu mai vrea e-mailuri de la noi (a apăsat pe pagina de dezabonare). Panoul nu-i mai trimite nimic.",
      scrisDe: "firma, din linkul din e-mail",
    }).catch(() => false);
  }
  return { nou: nou.length > 0, firme: firme.map((f) => f.denumire) };
}

/** Firma nu mai primește e-mailuri. Întoarce `true` numai prima dată. */
export async function opresteEmailurile(firmaId: string, cine: string): Promise<boolean> {
  const r = await intreaba<{ id: string }>(
    `UPDATE firme SET fara_emailuri_la = now() WHERE id = $1 AND fara_emailuri_la IS NULL RETURNING id`,
    [firmaId],
  );
  if (!r.length) return false;
  /*
    Refuzul ține de adresă: intră în `adrese_oprite` adresa din fișă și toate
    adresele la care i s-a scris firmei (linkul e al firmei, deci nu se știe
    care dintre ele a apăsat — se oprește tot, ca să nu mai primească nimeni).
    Apoi orice altă fișă cu una din adresele astea se oprește și ea.
  */
  await intreaba(
    `INSERT INTO adrese_oprite (email)
     SELECT DISTINCT lower(trim(a)) FROM (
       SELECT email AS a FROM firme WHERE id = $1
       UNION ALL
       SELECT unnest(string_to_array(catre, ',')) FROM mesaje_firme WHERE firma_id = $1 AND directie = 'trimis'
     ) x WHERE trim(a) <> ''
     ON CONFLICT (email) DO NOTHING`,
    [firmaId],
  );
  await intreaba(
    `UPDATE firme SET fara_emailuri_la = now()
      WHERE fara_emailuri_la IS NULL AND lower(email) IN (SELECT email FROM adrese_oprite)`,
  );
  await scrieInteractiune({
    firmaId,
    fel: "notita",
    rezumat: "Nu mai vrea e-mailuri de la noi. Panoul nu-i mai trimite nimic.",
    scrisDe: cine,
  }).catch(() => false);
  return true;
}

export async function pornesteEmailurile(firmaId: string, cine: string): Promise<void> {
  await intreaba(
    `UPDATE firme SET fara_emailuri_la = NULL
      WHERE id = $1 OR lower(email) = (SELECT lower(email) FROM firme WHERE id = $1)`,
    [firmaId],
  );
  await intreaba(
    `DELETE FROM adrese_oprite WHERE email IN (
       SELECT lower(trim(a)) FROM (
         SELECT email AS a FROM firme WHERE id = $1
         UNION ALL
         SELECT unnest(string_to_array(catre, ',')) FROM mesaje_firme WHERE firma_id = $1 AND directie = 'trimis'
       ) x)`,
    [firmaId],
  );
  await scrieInteractiune({
    firmaId,
    fel: "notita",
    rezumat: "Am vorbit cu firma: vrea iar e-mailuri de la noi.",
    scrisDe: cine,
  }).catch(() => false);
}

/**
 * Rândul de la sfârșitul fiecărui e-mail către o firmă: cum spune că nu mai
 * vrea mesaje. Scris aici, nu de mână, ca să nu lipsească niciodată.
 * Firmelor li se scrie cu „dumneavoastră”.
 */
export function corpScrisoare(
  htmlScris: string,
  cine: string,
  refuz?: string | null,
  interes?: string | null,
  emailSemnatura: string = EMAIL.contact,
  campanii: Text[] = [],
): { html: string; text: string } {
  const curat = curataHtml(htmlScris)
    // Pozele din editor: `f_auto` poate da WebP sau AVIF, pe care Outlook nu le arată.
    .replace(/(https:\/\/res\.cloudinary\.com\/[^"]*?)f_auto/g, "$1f_jpg")
    // O adresă relativă nu duce nicăieri dintr-o căsuță de e-mail.
    .replace(/(<img [^>]*src=")\/(?!\/)/g, `$1${ADRESA_SITE}/`)
    .replace(/<div data-video[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/g, "")
    .replace(/<p>/g, `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:#232323;">`)
    .replace(/<h2>/g, `<h2 style="margin:16px 0 10px;font-family:${FONT};font-size:20px;color:#232323;">`)
    .replace(/<h3>/g, `<h3 style="margin:14px 0 8px;font-family:${FONT};font-size:17px;color:#232323;">`)
    .replace(/<(ul|ol)>/g, `<$1 style="margin:0 0 14px;padding-left:22px;font-family:${FONT};font-size:15px;line-height:1.6;color:#232323;">`)
    .replace(/<blockquote>/g, `<blockquote style="margin:0 0 14px;padding-left:14px;border-left:3px solid #b82b09;color:#616161;">`)
    .replace(/<img /g, `<img style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:0 0 14px;" `)
    .replace(/<a /g, `<a style="color:#b82b09;" `);
  const semnatura = [
    cine,
    ASOCIATIA.denumire,
    TELEFOANE.map((t) => t.afisat).join(" · "),
    emailSemnatura,
    ADRESA_SITE.replace(/^https?:\/\//, ""),
  ].filter(Boolean);
  const mic = `margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:#616161;`;
  const html = `<!doctype html><html lang="ro"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:20px 16px;background:#ffffff;">
<div style="max-width:640px;">
${curat}
${campanii.map(cardCampanie).join("\n")}
${interes || refuz ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;"><tr>
${interes ? `<td bgcolor="#b82b09" style="border-radius:999px;"><a href="${scapa(interes)}" style="display:inline-block;padding:11px 22px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Da, ne interesează</a></td><td style="width:10px;"></td>` : ""}
${refuz ? `<td style="border:1px solid #cfd3d8;border-radius:999px;"><a href="${scapa(refuz)}" style="display:inline-block;padding:10px 20px;font-family:${FONT};font-size:14px;color:#616161;text-decoration:none;border-radius:999px;">Nu mai doresc mesaje</a></td>` : ""}
</tr></table>` : ""}
<p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:#616161;">Dacă nu doriți să mai primiți mesaje de la noi, ${refuz ? `<a href="${scapa(refuz)}" style="color:#616161;text-decoration:underline;">apăsați aici</a>` : "răspundeți la acest e-mail cu „NU”"}${refuz ? " sau răspundeți la acest e-mail cu „NU”" : ""} și nu vă mai scriem.</p>
<div style="margin-top:22px;padding-top:12px;border-top:1px solid #e6e8ec;">
${semnatura.map((s, i) => `<p style="${mic}${i === 0 ? "font-weight:bold;color:#232323;" : ""}">${scapa(s)}</p>`).join("\n")}
</div></div></body></html>`;
  const interesText = interes ? `Vă interesează? Apăsați aici: ${interes}` : "";
  const refuzText = `Dacă nu doriți să mai primiți mesaje de la noi${refuz ? `, deschideți ${refuz} sau` : ","} răspundeți la acest e-mail cu „NU” și nu vă mai scriem.`;
  const campaniiText = campanii.map((c) => `${c.titlu}: ${linkCampanie(c)}`);
  return { html, text: [...textSimplu(htmlScris), ...campaniiText, ...(interesText ? [interesText] : []), refuzText, "", "--", ...semnatura].join("\n\n") };
}

/* ── Campaniile de pe site, puse în e-mail ──────────────────────────── */

/** Câte campanii încap într-un e-mail către o firmă. Mai multe ar fi un buletin. */
export const MAXIM_CAMPANII = 3;

/** Linkul campaniei, cu etichetă: Google Analytics arată ce au adus e-mailurile către firme. */
function linkCampanie(c: Pick<Text, "slug">): string {
  return `${ADRESA_SITE}/campanii/${encodeURIComponent(c.slug)}?utm_source=email&utm_medium=firme&utm_campaign=${encodeURIComponent(c.slug)}`;
}

/** Un card simplu: poza, titlul, primele rânduri, butonul. Tabel, ca să țină și în Outlook. */
function cardCampanie(c: Text): string {
  const link = scapa(linkCampanie(c));
  const rezumat = (c.rezumat || textSimplu(c.continut)[0] || "").slice(0, 220);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;border:1px solid #e6e8ec;border-radius:10px;">
<tr><td style="padding:0;">
${c.poza ? `<a href="${link}"><img src="${scapa(pozaPentruEmail(c.poza.id, 1072))}" alt="${scapa(c.poza.alt || c.titlu)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:10px 10px 0 0;" /></a>` : ""}
</td></tr>
<tr><td style="padding:14px 16px 16px;">
<p style="margin:0 0 6px;font-family:${FONT};font-size:17px;font-weight:bold;line-height:1.35;color:#232323;">${scapa(c.titlu)}</p>
${rezumat ? `<p style="margin:0 0 12px;font-family:${FONT};font-size:14px;line-height:1.55;color:#616161;">${scapa(rezumat)}</p>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#b82b09" style="border-radius:999px;"><a href="${link}" style="display:inline-block;padding:9px 18px;font-family:${FONT};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;">Vezi campania</a></td></tr></table>
</td></tr></table>`;
}

/**
 * Campaniile alese în formular: numai cele publicate, cel mult trei. Un
 * identificator din afara listei (scris de mână, o campanie scoasă de pe
 * site între timp) se sare.
 */
export async function campaniileAlese(ids: unknown[]): Promise<Text[]> {
  const { textDupaId } = await import("@/lib/texte");
  const unice = [...new Set(ids.map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)))].slice(0, MAXIM_CAMPANII);
  const gasite = await Promise.all(unice.map((id) => textDupaId(id).catch(() => null)));
  return gasite.filter((t): t is Text => Boolean(t && t.fel === "campanie" && t.publicat));
}

/* ── Trimiterea ─────────────────────────────────────────────────────── */

/**
 * E-mailul așa cum îl primește firma: subiectul și textul cu numele ei,
 * butoanele, rândul de refuz, semnătura și „De la”. Aceeași funcție pentru
 * trimitere și pentru „Vezi cum arată”, ca previzualizarea să nu mintă.
 * Fără `id` (previzualizare fără firmă aleasă), butoanele duc nicăieri.
 */
export function scrisoarea(d: {
  firma: Pick<Firma, "denumire" | "persoana"> & { id?: string };
  subiect: string;
  html: string;
  trimisDe: string;
  emailCelui: string | null;
  campanii?: Text[];
}) {
  const subiect = personalizeaza(d.subiect, d.firma, false);
  const scris = personalizeaza(d.html, d.firma, true);
  // Intrat cu parola asociației, „cine” e chiar asociația: nu se scrie de două ori.
  const om = /^asocia/i.test(d.trimisDe) ? "" : d.trimisDe;
  // Firma vede adresa omului care scrie (mihaela.sfichi@…), dacă e pe domeniul asociației.
  const dela = om ? adresaDeLa(d.emailCelui) : adresaDeLa(null);
  const refuz = d.firma.id ? linkRefuz(d.firma.id) : "#";
  const interes = d.firma.id ? linkInteres(d.firma.id) : "#";
  const { html, text } = corpScrisoare(scris, om, refuz, interes, dela, d.campanii ?? []);
  const expeditorNume = om ? `${om} · ${ASOCIATIA.denumire}` : ASOCIATIA.denumire;
  return { subiect, html, text, dela, expeditorNume };
}

export type FisierAtasat = { nume: string; tip: string; continut: Uint8Array };

export async function trimiteFirmei(d: {
  firma: Firma;
  catre: string | string[];
  subiect: string;
  html: string;
  atasamente: FisierAtasat[];
  trimisDe: string;
  /** Adresa de e-mail a celui care scrie, dacă are cont: răspunsul de rezervă. */
  emailCelui: string | null;
  lot?: string;
  masa?: boolean;
  campanii?: Text[];
}): Promise<"trimis" | "esuat" | "refuza"> {
  // Firma a spus că nu mai vrea: nu pleacă nimic, oricine ar apăsa. Și nici
  // la o adresă care a spus „nu” din fișa altei firme (pusă din nou, alt nume).
  if (d.firma.faraEmailuri) return "refuza";
  const adrese = [d.catre].flat().map((x) => x.toLowerCase());
  const [opriti] = await intreaba<{ nr: string }>(
    `SELECT (SELECT count(*) FROM firme WHERE fara_emailuri_la IS NOT NULL AND lower(email) = ANY($1::text[]))
          + (SELECT count(*) FROM adrese_oprite WHERE email = ANY($1::text[])) AS nr`,
    [adrese],
  );
  if (Number(opriti?.nr ?? 0) > 0) return "refuza";
  const { subiect, html, text, dela, expeditorNume } = scrisoarea({
    firma: d.firma,
    subiect: d.subiect,
    html: d.html,
    trimisDe: d.trimisDe,
    emailCelui: d.emailCelui,
    campanii: d.campanii,
  });
  const antet = linkRefuz(d.firma.id, true);
  const raspundeLa = adresaDeRaspuns(d.firma.id) ?? d.emailCelui ?? EMAIL.contact;
  const r = await trimiteEmailCuId({
    catre: d.catre,
    subiect,
    html,
    text,
    raspundeLa,
    atasamente: d.atasamente.map((a) => ({ nume: a.nume, continut: a.continut })),
    expeditorNume,
    expeditorAdresa: dela,
    masa: d.masa,
    antete: antet
      ? { "List-Unsubscribe": `<${antet}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
      : undefined,
  }).catch(() => ({ ok: false, id: null }));
  if (!r.ok) return "esuat";
  const [rand] = await intreaba<{ id: string }>(
    `INSERT INTO mesaje_firme (firma_id, directie, de_la, catre, subiect, html, text_simplu, resend_id, trimis_de, lot)
     VALUES ($1,'trimis',$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [d.firma.id, dela, [d.catre].flat().join(", "), subiect, curataHtml(personalizeaza(d.html, d.firma, true) + (d.campanii ?? []).map((c) => `<p>Campania: <a href="${scapa(linkCampanie(c))}">${scapa(c.titlu)}</a></p>`).join("")), text, r.id, d.trimisDe, d.lot ?? null],
  );
  for (const a of d.atasamente) {
    await intreaba(
      `INSERT INTO atasamente_firme (mesaj_id, nume, tip, marime, continut) VALUES ($1,$2,$3,$4,$5)`,
      [rand.id, a.nume, a.tip, a.continut.byteLength, Buffer.from(a.continut)],
    );
  }
  await scrieInteractiune({
    firmaId: d.firma.id,
    fel: "email",
    rezumat: `E-mail trimis din panou: „${subiect}”${d.atasamente.length ? ` (${d.atasamente.length} atașament${d.atasamente.length > 1 ? "e" : ""})` : ""}`,
    scrisDe: d.trimisDe,
  }).catch(() => false);
  return "trimis";
}

/* ── Citirea ─────────────────────────────────────────────────────────── */

type RandMesaj = {
  id: string;
  directie: "trimis" | "primit";
  de_la: string;
  catre: string;
  subiect: string;
  html: string;
  text_simplu: string;
  trimis_de: string | null;
  creat_la: Date;
  livrat_la: Date | null;
  deschis_la: Date | null;
  deschideri: number;
  clic_la: Date | null;
  clicuri: number;
  ultimul_link: string | null;
  respins: string | null;
  citit_la: Date | null;
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export async function mesajeleFirmei(firmaId: string): Promise<Mesaj[]> {
  return citeste(`firma_id = $1 ORDER BY creat_la ASC LIMIT 500`, [firmaId]);
}

async function citeste(unde: string, parametri: unknown[]): Promise<Mesaj[]> {
  const randuri = await intreaba<RandMesaj>(
    `SELECT id, directie, de_la, catre, subiect, html, text_simplu, trimis_de, creat_la, livrat_la,
            deschis_la, deschideri, clic_la, clicuri, ultimul_link, respins, citit_la
       FROM mesaje_firme WHERE ${unde}`,
    parametri,
  );
  const ids = randuri.map((r) => r.id);
  const atas = ids.length
    ? await intreaba<{ id: string; mesaj_id: string; nume: string; tip: string; marime: number }>(
        `SELECT id, mesaj_id, nume, tip, marime FROM atasamente_firme WHERE mesaj_id = ANY($1::bigint[]) ORDER BY id`,
        [ids],
      )
    : [];
  return randuri.map((r) => ({
    id: String(r.id),
    directie: r.directie,
    deLa: r.de_la,
    catre: r.catre,
    subiect: r.subiect,
    html: r.html,
    text: r.text_simplu,
    trimisDe: r.trimis_de,
    creatLa: r.creat_la.toISOString(),
    livratLa: iso(r.livrat_la),
    deschisLa: iso(r.deschis_la),
    deschideri: r.deschideri,
    clicLa: iso(r.clic_la),
    clicuri: r.clicuri,
    ultimulLink: r.ultimul_link,
    respins: r.respins,
    citit: r.directie === "trimis" || r.citit_la !== null,
    atasamente: atas
      .filter((a) => String(a.mesaj_id) === String(r.id))
      .map((a) => ({ id: String(a.id), nume: a.nume, tip: a.tip, marime: a.marime })),
  }));
}

export async function marcheazaCitite(firmaId: string): Promise<void> {
  await intreaba(
    `UPDATE mesaje_firme SET citit_la = now() WHERE firma_id = $1 AND directie = 'primit' AND citit_la IS NULL`,
    [firmaId],
  );
}

export type Discutie = {
  firmaId: string | null;
  denumire: string;
  persoana: string | null;
  ultimul: { subiect: string; directie: "trimis" | "primit"; cand: string; deLa: string };
  necitite: number;
  trimise: number;
  deschise: number;
  /** E-mailuri trimise de la ultimul răspuns al firmei (sau de la început). */
  faraRaspuns: number;
};

/** Câte e-mailuri i s-au trimis de la ultimul ei răspuns. */
export function trimiseFaraRaspuns(mesaje: Pick<Mesaj, "directie">[]): number {
  let n = 0;
  for (const m of mesaje) n = m.directie === "primit" ? 0 : n + 1;
  return n;
}

/** De la câte e-mailuri fără răspuns se spune „nu răspunde”. */
export const NU_RASPUNDE_DUPA = 2;

/** Discuțiile, cele cu răspunsuri necitite primele, apoi cele mai noi. */
export async function discutii(): Promise<Discutie[]> {
  const r = await intreaba<{
    firma_id: string | null;
    denumire: string | null;
    persoana: string | null;
    subiect: string;
    directie: "trimis" | "primit";
    creat_la: Date;
    de_la: string;
    necitite: string;
    trimise: string;
    deschise: string;
    fara_raspuns: string;
  }>(
    `WITH ult AS (
       SELECT DISTINCT ON (coalesce(firma_id::text, 'm' || id::text)) *
         FROM mesaje_firme ORDER BY coalesce(firma_id::text, 'm' || id::text), creat_la DESC
     )
     SELECT u.firma_id, f.denumire, f.persoana, u.subiect, u.directie, u.creat_la, u.de_la,
            (SELECT count(*) FROM mesaje_firme m WHERE m.directie = 'primit' AND m.citit_la IS NULL
               AND (m.firma_id = u.firma_id OR (u.firma_id IS NULL AND m.id = u.id))) AS necitite,
            (SELECT count(*) FROM mesaje_firme m WHERE m.firma_id = u.firma_id AND m.directie = 'trimis') AS trimise,
            (SELECT count(*) FROM mesaje_firme m WHERE m.firma_id = u.firma_id AND m.directie = 'trimis' AND m.deschideri > 0) AS deschise,
            (SELECT count(*) FROM mesaje_firme m WHERE m.firma_id = u.firma_id AND m.directie = 'trimis'
               AND m.creat_la > coalesce((SELECT max(p.creat_la) FROM mesaje_firme p WHERE p.firma_id = u.firma_id AND p.directie = 'primit'), '-infinity')) AS fara_raspuns
       FROM ult u LEFT JOIN firme f ON f.id = u.firma_id
      ORDER BY (SELECT count(*) FROM mesaje_firme m WHERE m.directie = 'primit' AND m.citit_la IS NULL
                  AND (m.firma_id = u.firma_id OR (u.firma_id IS NULL AND m.id = u.id))) > 0 DESC,
               u.creat_la DESC
      LIMIT 300`,
  );
  return r.map((x) => ({
    firmaId: x.firma_id,
    denumire: x.denumire ?? x.de_la,
    persoana: x.persoana,
    ultimul: { subiect: x.subiect, directie: x.directie, cand: x.creat_la.toISOString(), deLa: x.de_la },
    necitite: Number(x.necitite),
    trimise: Number(x.trimise),
    deschise: Number(x.deschise),
    faraRaspuns: Number(x.fara_raspuns),
  }));
}

/** Răspunsurile care n-au fost legate de nicio firmă, cu tot cu text. */
export async function mesajeNelegate(): Promise<Mesaj[]> {
  return citeste(`firma_id IS NULL ORDER BY creat_la DESC LIMIT 50`, []);
}

/** Răspunsurile nelegate se citesc pe pagina de mesaje, deci se marchează acolo. */
export async function marcheazaNelegateCitite(): Promise<void> {
  await intreaba(`UPDATE mesaje_firme SET citit_la = now() WHERE firma_id IS NULL AND citit_la IS NULL`);
}

export async function cateNecitite(): Promise<number> {
  const [r] = await intreaba<{ nr: string }>(
    `SELECT count(*) AS nr FROM mesaje_firme WHERE directie = 'primit' AND citit_la IS NULL`,
  );
  return Number(r?.nr ?? 0);
}

export async function atasamentul(id: string): Promise<{ nume: string; tip: string; continut: Buffer } | null> {
  if (!/^\d{1,18}$/.test(id)) return null;
  const [r] = await intreaba<{ nume: string; tip: string; continut: Buffer }>(
    `SELECT nume, tip, continut FROM atasamente_firme WHERE id = $1`,
    [id],
  );
  return r ?? null;
}

/* ── Ce anunță Resend ────────────────────────────────────────────────── */

export async function evenimentTrimis(
  resendId: string,
  fel: "livrat" | "deschis" | "clic" | "respins",
  detaliu?: string,
): Promise<void> {
  if (fel === "livrat") {
    await intreaba(`UPDATE mesaje_firme SET livrat_la = coalesce(livrat_la, now()) WHERE resend_id = $1`, [resendId]);
  } else if (fel === "deschis") {
    await intreaba(
      `UPDATE mesaje_firme SET deschideri = deschideri + 1, deschis_la = coalesce(deschis_la, now()) WHERE resend_id = $1`,
      [resendId],
    );
  } else if (fel === "clic") {
    await intreaba(
      `UPDATE mesaje_firme SET clicuri = clicuri + 1, clic_la = coalesce(clic_la, now()), ultimul_link = $2 WHERE resend_id = $1`,
      [resendId, (detaliu ?? "").slice(0, 500) || null],
    );
  } else {
    await intreaba(`UPDATE mesaje_firme SET respins = $2 WHERE resend_id = $1`, [resendId, (detaliu ?? "respins").slice(0, 300)]);
  }
}

export async function salveazaPrimit(d: {
  resendId: string;
  firmaId: string | null;
  deLa: string;
  catre: string;
  subiect: string;
  html: string;
  text: string;
  atasamente: FisierAtasat[];
}): Promise<string | null> {
  const randuri = await intreaba<{ id: string }>(
    `INSERT INTO mesaje_firme (firma_id, directie, de_la, catre, subiect, html, text_simplu, resend_id)
     VALUES ($1,'primit',$2,$3,$4,$5,$6,$7)
     ON CONFLICT (resend_id) DO NOTHING RETURNING id`,
    [d.firmaId, d.deLa, d.catre, d.subiect, d.html, d.text, d.resendId],
  );
  const id = randuri[0]?.id;
  if (!id) return null; // același anunț, a doua oară
  for (const a of d.atasamente) {
    await intreaba(
      `INSERT INTO atasamente_firme (mesaj_id, nume, tip, marime, continut) VALUES ($1,$2,$3,$4,$5)`,
      [id, a.nume, a.tip, a.continut.byteLength, Buffer.from(a.continut)],
    );
  }
  return String(id);
}

/** Firma după adresa de e-mail din fișă, când răspunsul n-a venit pe adresa ei. */
export async function firmaDupaEmail(email: string): Promise<string | null> {
  const r = await intreaba<{ id: string }>(
    `SELECT id FROM firme WHERE lower(email) = lower($1) ORDER BY schimbat_la DESC LIMIT 2`,
    [email],
  );
  return r.length === 1 ? r[0].id : null;
}
