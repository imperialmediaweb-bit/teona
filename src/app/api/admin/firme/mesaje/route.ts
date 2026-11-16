import { randomUUID } from "node:crypto";
import {
  email as emailValid,
  formularAdmin,
  limitaDeRata,
  nuTrece as nuTreceSimplu,
  raspuns,
  sesiuneExpirata,
  text,
  trimiteLa,
} from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { firma as citesteFirma } from "@/lib/crm";
import { areEmail } from "@/lib/email/trimite";
import { tipDinOcteti } from "@/lib/poza-urcata";
import { textSimplu } from "@/lib/text-bogat";
import { probaAreVoie } from "@/lib/proba";
import { campaniileAlese, LIMITA_LOT, trimiteFirmei, type FisierAtasat } from "@/lib/mesaje-firme";

/**
 * Trimite un e-mail unei firme (`firma`) sau mai multora (`firme`), fiecăreia
 * separat, cu numele ei. Adresele vin din baza de date; numai la o singură
 * firmă se poate scrie altă adresă decât cea din fișă (alt om din firmă).
 */

const MAXIM_TOTAL = 10 * 1024 * 1024;
const MAXIM_FISIERE = 5;
const UUID = /^[0-9a-f-]{36}$/i;

function tipul(nume: string, cap: Uint8Array): string | null {
  const poza = tipDinOcteti(cap);
  if (poza) return poza;
  const s = String.fromCharCode(...cap.slice(0, 4));
  if (s === "%PDF") return "application/pdf";
  if (s.startsWith("PK")) {
    if (/\.pptx$/i.test(nume)) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (/\.xlsx$/i.test(nume)) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (/\.docx$/i.test(nume)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return null;
  }
  // .doc / .ppt / .xls vechi: semnătura OLE.
  if (cap[0] === 0xd0 && cap[1] === 0xcf && cap[2] === 0x11 && cap[3] === 0xe0) return "application/octet-stream";
  return null;
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-firme-mesaje",
    maxim: 60,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!areEmail()) return nuTreceSimplu("Trimiterea de e-mailuri nu e configurată pe site.");

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;
  // După o eroare, browserul nu mai ține fișierele alese: omul trebuie să afle.
  const cuFisiere = f.getAll("fisier").some((x) => x instanceof File && x.size > 0);
  const nuTrece = (m: string) => nuTreceSimplu(cuFisiere ? `${m} Atașamentele trebuie alese din nou.` : m);

  // Câmpul gol la un răspuns: subiectul sugerat („Re: …”).
  const subiect = text(f.get("subiect"), 200) ?? text(f.get("subiect_implicit"), 200);
  if (!subiect) return nuTrece("Scrie subiectul.");
  const continut = String(f.get("continut") ?? "").trim();
  if (textSimplu(continut).join(" ").length < 2) return nuTrece("Scrie textul e-mailului.");
  if (continut.length > 100_000) return nuTrece("Textul e prea lung.");

  const fisiere = f.getAll("fisier").filter((x): x is File => x instanceof File && x.size > 0);
  if (fisiere.length > MAXIM_FISIERE) return nuTrece(`Cel mult ${MAXIM_FISIERE} fișiere atașate.`);
  if (fisiere.reduce((t, x) => t + x.size, 0) > MAXIM_TOTAL)
    return nuTrece("Fișierele atașate trec de 10 MB împreună. Pune-le mai mici sau trimite un link.");
  const atasamente: FisierAtasat[] = [];
  for (const x of fisiere) {
    const continutFisier = new Uint8Array(await x.arrayBuffer());
    const tip = tipul(x.name, continutFisier.slice(0, 16));
    if (!tip)
      return nuTrece(`„${x.name}” nu e PDF, Word, PowerPoint, Excel sau poză. Verifică fișierul.`);
    atasamente.push({ nume: x.name.replace(/[\\/\r\n"]/g, "_").slice(0, 150), tip, continut: continutFisier });
  }

  const campanii = await campaniileAlese(f.getAll("campanii"));

  const cine = await cineEsteConectat();
  const trimisDe = cine?.nume ?? "Asociația";
  const emailCelui = cine?.fel === "cont" ? cine.utilizator.email : null;

  // O singură firmă: se întoarce în discuția ei.
  const una = String(f.get("firma") ?? "");
  if (una) {
    if (!UUID.test(una)) return nuTrece("Firma nu există.");
    // Cheia de probă scrie numai firmelor de probă (cu adresa de probă).
    if (!(await probaAreVoie("firme", una))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
    const fi = await citesteFirma(una);
    if (!fi) return nuTrece("Firma nu există.");
    // Una sau mai multe adrese ale aceleiași firme, despărțite prin virgulă.
    // Adresele, și din forma lipită din Gmail: „Ion Pop <ion@firma.ro>, ana@firma.ro”.
    const brut = String(f.get("catre") ?? fi.email);
    const scrise = brut.includes("<")
      ? (brut.match(/[^\s<>,;"]+@[^\s<>,;"]+/g) ?? [])
      : brut.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
    const catre = [...new Set(scrise.map((x) => emailValid(x)))];
    if (!catre.length || catre.some((x) => !x)) return nuTrece("O adresă de e-mail nu e scrisă corect. Pune-le despărțite prin virgulă.");
    if (catre.length > 10) return nuTrece("Cel mult 10 adrese la un e-mail.");
    const rez = await trimiteFirmei({ firma: fi, catre: catre as string[], subiect, html: continut, atasamente, trimisDe, emailCelui, campanii });
    const semn = rez === "trimis" ? "trimis=1" : rez === "refuza" ? "refuza=1" : "ratat=1";
    return trimiteLa(`/admin/firme/${fi.id}/mesaje?${semn}#jos`);
  }

  // Mai multe firme: fiecare primește e-mailul ei.
  if (f.get("confirm") !== "da") return nuTrece("Bifează confirmarea de sub buton.");
  const ids = [...new Set(f.getAll("firme").map(String).filter((x) => UUID.test(x)))];
  if (!ids.length) return nuTrece("Bifează cel puțin o firmă.");
  if (ids.length > LIMITA_LOT)
    return nuTrece(`Cel mult ${LIMITA_LOT} firme o dată. Pentru o listă mare se folosește MailerLite.`);
  const lot = randomUUID();
  let plecate = 0;
  const ratate: string[] = [];
  const refuza: string[] = [];
  for (const id of ids) {
    if (!(await probaAreVoie("firme", id))) continue;
    const fi = await citesteFirma(id);
    const catre = fi ? emailValid(fi.email) : null;
    if (!fi || !catre) {
      if (fi) ratate.push(fi.denumire);
      continue;
    }
    const rez = await trimiteFirmei({
      firma: fi,
      catre,
      subiect,
      html: continut,
      atasamente,
      trimisDe,
      emailCelui,
      lot,
      masa: true,
      campanii,
    });
    if (rez === "trimis") plecate++;
    else if (rez === "refuza") refuza.push(fi.denumire);
    else ratate.push(fi.denumire);
  }
  // `salvat=1`: TineCiorna golește formularul, altfel textul ar rămâne pentru data viitoare.
  const unde = new URLSearchParams({ trimise: String(plecate), ...(plecate ? { salvat: "1" } : {}) });
  if (ratate.length) unde.set("ratate", ratate.join(", ").slice(0, 500));
  if (refuza.length) unde.set("refuza", refuza.join(", ").slice(0, 500));
  return trimiteLa(`/admin/firme/mesaje?${unde}`);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
