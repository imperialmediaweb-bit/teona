import { areBazaDeDate } from "@/lib/baza";
import { email as emailValid, formularCuLimita, limitaDeRata, trimiteLa } from "@/lib/api";
import { opresteAdresa } from "@/lib/mesaje-firme";
import { notificaPanoul } from "@/lib/notificari";
import { curat, trimiteEmail } from "@/lib/email/trimite";
import { paginaInterna } from "@/lib/email/plic";
import { CATRE_ASOCIATIE } from "@/date/asociatie";

/**
 * „Nu mai doresc mesaje” de pe pagina generală. Nu cere semnătură: linkul se
 * pune de mână în e-mailurile din căsuța obișnuită. Cel mult poate opri cineva
 * e-mailurile către altă adresă — adică nu-i mai scriem; nimic nu se șterge.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "nu-mai-doresc", maxim: 10, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  const formular = await formularCuLimita(cerere, 4096).catch(() => null);
  const adresa = emailValid(formular?.get("email"));
  if (!adresa) return trimiteLa("/nu-mai-doresc?gresit=1");
  if (!areBazaDeDate()) return trimiteLa("/nu-mai-doresc?eroare=1");
  const r = await opresteAdresa(adresa);
  if (r.nou) {
    const cine = r.firme.length ? r.firme.join(", ") : adresa;
    await notificaPanoul({ titlu: `${cine} nu mai vrea e-mailuri`, text: adresa, adresa: "/admin/firme" }).catch(() => 0);
    await trimiteEmail({
      catre: CATRE_ASOCIATIE,
      subiect: `${cine} nu mai vrea e-mailuri de la noi`,
      html: paginaInterna(
        "Cineva nu mai vrea e-mailuri",
        `<p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#232323;"><strong>${curat(adresa)}</strong>${r.firme.length ? ` (${curat(r.firme.join(", "))})` : ""} a apăsat „Nu mai doresc mesaje”. Nu-i mai scrieți; panoul nu-i mai trimite nimic.</p>`,
      ),
      text: `${adresa} a apăsat „Nu mai doresc mesaje”. Nu-i mai scrieți.`,
    }).catch(() => false);
  }
  return trimiteLa("/nu-mai-doresc?gata=1");
}
