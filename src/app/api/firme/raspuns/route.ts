import { areBazaDeDate } from "@/lib/baza";
import { formularCuLimita, limitaDeRata, trimiteLa } from "@/lib/api";
import { firma as citesteFirma } from "@/lib/crm";
import { firmaInteresata, interesValid } from "@/lib/mesaje-firme";
import { notificaPanoul } from "@/lib/notificari";
import { curat, trimiteEmail } from "@/lib/email/trimite";
import { paginaInterna } from "@/lib/email/plic";
import { CATRE_ASOCIATIE } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

/** „Da, ne interesează”, apăsat de o firmă pe pagina din linkul din e-mail. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "raspuns-firma", maxim: 30, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  const formular = await formularCuLimita(cerere, 4096).catch(() => null);
  const f = String(formular?.get("f") ?? "");
  const s = String(formular?.get("s") ?? "");
  if (!interesValid(f, s) || !areBazaDeDate()) return trimiteLa("/raspuns-firma?eroare=1");
  const fi = await citesteFirma(f);
  if (fi && (await firmaInteresata(f))) {
    await notificaPanoul({
      titlu: `${fi.denumire}: „Da, ne interesează”`,
      text: "Sună-i sau trimite-le contractul.",
      adresa: `/admin/firme/${f}/mesaje`,
    }).catch(() => 0);
    await trimiteEmail({
      catre: CATRE_ASOCIATIE,
      subiect: `${fi.denumire} a apăsat „Da, ne interesează”`,
      html: paginaInterna(
        "O firmă e interesată",
        `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;color:#232323;"><strong>${curat(fi.denumire)}</strong> (${curat(fi.persoana)}, ${curat(fi.email)}${fi.telefon ? `, ${curat(fi.telefon)}` : ""}) a apăsat „Da, ne interesează” în e-mailul vostru. Sunați-i sau trimiteți-le contractul.</p><p style="margin:0;font-family:Arial,sans-serif;font-size:15px;"><a href="${ADRESA_SITE}/admin/firme/${f}/mesaje" style="color:#b82b09;font-weight:bold;">Deschide discuția</a></p>`,
      ),
      text: `${fi.denumire} a apăsat „Da, ne interesează”. ${ADRESA_SITE}/admin/firme/${f}/mesaje`,
    }).catch(() => false);
  }
  return trimiteLa("/raspuns-firma?gata=1");
}
