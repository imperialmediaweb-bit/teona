import {
  email as emailValid,
  formularAdmin,
  limitaDeRata,
  nuTrece,
  raspuns,
  sesiuneExpirata,
  text,
  trimiteLa,
} from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { adaugaLead, scrieInteractiune } from "@/lib/crm";
import { probaAreVoie } from "@/lib/proba";
import { cuiValid, curataCui } from "@/lib/cui";

/** O firmă adăugată de mână, ca lead, și dusă direct la discuția ei. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "admin-firme-lead", maxim: 120, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;

  const denumire = text(f.get("denumire"), 200);
  if (!denumire) return nuTrece("Scrie numele firmei.");
  const email = emailValid(f.get("email"));
  if (!email) return nuTrece("Adresa de e-mail a firmei nu e scrisă corect.");
  // Cheia de probă adaugă numai firme cu adresa de probă, ca `curata-proba` să le găsească.
  if (!(await probaAreVoie("email", email))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
  const persoana = text(f.get("persoana"), 150) ?? "Echipa " + denumire;
  const cuiBrut = text(f.get("cui"), 20);
  if (cuiBrut) {
    const cuiNr = curataCui(cuiBrut);
    if (cuiNr === null || !cuiValid(cuiNr))
      return nuTrece("CUI-ul nu e scris corect (are doar cifre, poate începe cu RO, iar ultima cifră e de control). Dacă nu-l știi, lasă-l gol.");
  }
  const telefon = text(f.get("telefon"), 40);
  const nota = text(f.get("nota"), 2000);

  const r = await adaugaLead({ cui: cuiBrut, denumire, persoana, email, telefon, nota });
  if (!r.eraDeja) {
    const cine = await cineEsteConectat();
    await scrieInteractiune({
      firmaId: r.id,
      fel: "notita",
      rezumat: `Adăugată ca lead din panou${nota ? `: ${nota}` : "."}`,
      scrisDe: cine?.nume,
    }).catch(() => false);
  }
  // `salvat=1`: TineCiorna golește formularul de lead, altfel următoarea firmă
  // s-ar deschide cu numele și CUI-ul celei de acum.
  return trimiteLa(`/admin/firme/${r.id}/mesaje?${r.eraDeja ? "era=1" : "nou=1"}${r.refuza ? "&refuza=1" : ""}&salvat=1#jos`);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
