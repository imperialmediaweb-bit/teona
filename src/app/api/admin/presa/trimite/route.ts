import { limitaDeRata, nuTrece, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { contactePresa } from "@/lib/presa";
import { areEmail, curat, trimiteEmail } from "@/lib/email/trimite";
import { ASOCIATIA, EMAIL, TELEFOANE } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Comunicatul de presă, trimis din panou.
 *
 * Asociația a cerut-o: bifezi redacțiile (sau toate), scrii, apeși. Ca să nu
 * arate a mesaj în masă, **fiecare redacție primește e-mailul ei**, cu
 * adresa ei la „Către” — nu o listă la Bcc. Răspunsul ziaristului merge la
 * adresa de contact a asociației (`reply_to`), deci ajunge la un om.
 *
 * Adresele nu vin din formular: vin identificatorii bifați, iar adresa se ia
 * din baza de date. Altfel cineva ar putea trimite, prin serverul asociației,
 * la orice adresă scrisă de mână.
 *
 * E-mailul e simplu, fără bandă și fără butoane: un ziarist vrea textul, nu
 * un buletin. Jos, datele de contact ale asociației.
 */

const FISIER_MAXIM = 10 * 1024 * 1024;
const FISIERE_MAXIM = 3;
const TIPURI = /\.(pdf|jpe?g|png|webp|docx?)$/i;

function corp(paragrafe: string[]): { html: string; text: string } {
  const p =
    "margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#232323;";
  const mic =
    "margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#616161;";
  const semnatura = [
    ASOCIATIA.denumire,
    TELEFOANE.map((t) => t.afisat).join(" · "),
    EMAIL.contact,
    ADRESA_SITE.replace(/^https?:\/\//, ""),
  ];
  const html = `<!doctype html><html lang="ro"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px 16px;background:#ffffff;">
<div style="max-width:640px;">
${paragrafe.map((x) => `<p style="${p}">${curat(x).replace(/\n/g, "<br />")}</p>`).join("\n")}
<div style="margin-top:24px;padding-top:14px;border-top:1px solid #e6e8ec;">
${semnatura.map((s, i) => `<p style="${mic}${i === 0 ? "font-weight:bold;color:#232323;" : ""}">${curat(s)}</p>`).join("\n")}
</div></div></body></html>`;
  return {
    html,
    text: [...paragrafe, "", "--", ...semnatura].join("\n\n"),
  };
}

export async function POST(cerere: Request) {
  // Câteva comunicate pe lună; zece pe oră înseamnă că s-a stricat ceva.
  const prea = limitaDeRata(cerere, {
    cheie: "admin-presa-trimite",
    maxim: 10,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/presa"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!areEmail()) return nuTrece("Trimiterea de e-mailuri nu e configurată pe site.");

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const subiect = text(formular.get("subiect"), 200);
  if (!subiect) return nuTrece("Scrie subiectul comunicatului.");
  const continut = String(formular.get("text") ?? "").replace(/\r\n/g, "\n").trim();
  if (continut.length < 40) return nuTrece("Textul comunicatului e prea scurt.");
  if (continut.length > 20_000) return nuTrece("Textul comunicatului e prea lung.");
  if (formular.get("confirm") !== "da")
    return nuTrece("Bifează că ai citit comunicatul înainte să-l trimiți.");

  const alese = new Set(formular.getAll("contact").map(String));
  const destinatari = (await contactePresa()).filter(
    (c) => c.activ && c.email && alese.has(c.id),
  );
  if (!destinatari.length) return nuTrece("Bifează cel puțin o redacție.");

  const fisiere = formular
    .getAll("fisier")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fisiere.length > FISIERE_MAXIM)
    return nuTrece(`Cel mult ${FISIERE_MAXIM} fișiere atașate.`);
  if (fisiere.some((f) => !TIPURI.test(f.name)))
    return nuTrece("Atașează numai PDF, Word sau poze (JPG, PNG, WebP).");
  if (fisiere.reduce((t, f) => t + f.size, 0) > FISIER_MAXIM)
    return nuTrece("Fișierele atașate trec de 10 MB împreună. Trimite pozele mai mici.");
  const atasamente = await Promise.all(
    fisiere.map(async (f) => ({
      nume: f.name,
      continut: new Uint8Array(await f.arrayBuffer()),
    })),
  );

  const { html, text: simplu } = corp(continut.split(/\n{2,}/).filter((x) => x.trim()));

  let plecate = 0;
  const ratate: string[] = [];
  for (const c of destinatari) {
    const ok = await trimiteEmail({
      catre: c.email!,
      subiect,
      html,
      text: simplu,
      raspundeLa: EMAIL.contact,
      atasamente,
    }).catch(() => false);
    if (ok) plecate++;
    else ratate.push(c.publicatie);
  }

  const unde = new URLSearchParams({ trimis: String(plecate) });
  if (ratate.length) unde.set("ratate", ratate.join(", ").slice(0, 500));
  return trimiteLa(`/admin/presa?${unde}#trimite`);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
