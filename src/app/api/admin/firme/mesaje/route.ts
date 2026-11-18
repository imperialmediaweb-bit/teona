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
import { adaugaLead, firma as citesteFirma, scrieInteractiune } from "@/lib/crm";
import { cuiValid, curataCui } from "@/lib/cui";
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
    // Cheia de probă scrie numai la adresa de probă: altfel rândul din discuție
    // ar purta o adresă adevărată, iar „opreste”/„porneste” ar atinge refuzul ei.
    for (const x of catre) if (!(await probaAreVoie("email", x as string))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
    const rez = await trimiteFirmei({ firma: fi, catre: catre as string[], subiect, html: continut, atasamente, trimisDe, emailCelui, campanii });
    const semn = rez === "trimis" ? "trimis=1" : rez === "refuza" ? "refuza=1" : "ratat=1";
    return trimiteLa(`/admin/firme/${fi.id}/mesaje?${semn}#jos`);
  }

  // „+ E-mail nou”: firmele bifate și, poate, o firmă nouă scrisă pe loc.
  const ids = [...new Set(f.getAll("firme").map(String).filter((x) => UUID.test(x)))];
  const areNoua = Boolean(text(f.get("nou_denumire"), 200) || text(f.get("nou_email"), 200));
  if (!ids.length && !areNoua) return nuTrece("Alege cel puțin o firmă, sau adaugă una nouă.");
  if (ids.length + (areNoua ? 1 : 0) > LIMITA_LOT)
    return nuTrece(`Cel mult ${LIMITA_LOT} firme o dată. Pentru o listă mare se folosește MailerLite.`);
  // Confirmarea se cere numai când pleacă la mai multe firme deodată.
  if (ids.length + (areNoua ? 1 : 0) > 1 && f.get("confirm") !== "da") return nuTrece("Bifează confirmarea de sub buton.");
  let noua: string | null = null;
  if (areNoua) {
    const denumire = text(f.get("nou_denumire"), 200);
    if (!denumire) return nuTrece("Scrie numele firmei noi.");
    const email = emailValid(f.get("nou_email"));
    if (!email) return nuTrece("Adresa de e-mail a firmei noi nu e scrisă corect.");
    // Cheia de probă adaugă numai firme cu adresa de probă, ca `curata-proba` să le găsească.
    if (!(await probaAreVoie("email", email))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
    const cuiBrut = text(f.get("nou_cui"), 20);
    if (cuiBrut) {
      const cuiNr = curataCui(cuiBrut);
      if (cuiNr === null || !cuiValid(cuiNr))
        return nuTrece("CUI-ul firmei noi nu e scris corect (are doar cifre, poate începe cu RO, iar ultima cifră e de control). Dacă nu-l știi, lasă-l gol.");
    }
    const r = await adaugaLead({
      cui: cuiBrut,
      denumire,
      persoana: text(f.get("nou_persoana"), 150) ?? "Echipa " + denumire,
      email,
      telefon: null,
      nota: null,
    });
    /*
      Firma era deja în listă (același CUI sau aceeași adresă). Dacă adresa
      scrisă acum e alta decât cea din fișă, e-mailul n-ar pleca acolo unde
      crede omul: îi spunem să o aleagă din listă, nu-l trimitem altundeva.
    */
    if (r.eraDeja) {
      const era = await citesteFirma(r.id);
      if (era && era.email.toLowerCase() !== email.toLowerCase())
        return nuTrece(`Firma e deja în listă: „${era.denumire}”, cu adresa ${era.email}. Caut-o la „Către cine?” și bifeaz-o.`);
    }
    if (!r.eraDeja)
      await scrieInteractiune({ firmaId: r.id, fel: "notita", rezumat: "Adăugată din panou, la „E-mail nou”.", scrisDe: trimisDe }).catch(() => false);
    noua = r.id;
    if (!ids.includes(r.id)) ids.push(r.id);
  }
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
  /*
    O singură firmă: omul ajunge în discuția ei, unde vede e-mailul plecat.
    `salvat=1`: TineCiorna golește formularul, altfel textul ar rămâne pentru
    data viitoare.
  */
  if (ids.length === 1) {
    const semn = plecate ? "trimis=1" : refuza.length ? "refuza=1" : "ratat=1";
    return trimiteLa(`/admin/firme/${ids[0]}/mesaje?${semn}${plecate ? "&salvat=1" : ""}${noua && !plecate ? "&nou=1" : ""}#jos`);
  }
  const unde = new URLSearchParams({ trimise: String(plecate), ...(plecate ? { salvat: "1" } : {}) });
  if (ratate.length) unde.set("ratate", ratate.join(", ").slice(0, 500));
  if (refuza.length) unde.set("refuza", refuza.join(", ").slice(0, 500));
  return trimiteLa(`/admin/firme?${unde}`);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
