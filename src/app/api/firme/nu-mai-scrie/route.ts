import { areBazaDeDate } from "@/lib/baza";
import { formularCuLimita, limitaDeRata, trimiteLa } from "@/lib/api";
import { firma as citesteFirma } from "@/lib/crm";
import { opresteEmailurile, refuzValid } from "@/lib/mesaje-firme";
import { notificaPanoul } from "@/lib/notificari";
import { curat, trimiteEmail } from "@/lib/email/trimite";
import { paginaInterna } from "@/lib/email/plic";
import { CATRE_ASOCIATIE } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

/**
 * „Nu mai doresc mesaje”, apăsat de o firmă: din butonul de pe pagina
 * `/nu-mai-scrie` sau din dezabonarea dintr-un clic a lui Gmail și Outlook
 * (antetul `List-Unsubscribe-Post`, care trimite `List-Unsubscribe=One-Click`
 * aici, cu `f` și `s` în adresă). Linkul e semnat; fără semnătură bună nu
 * se oprește nimic.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "nu-mai-scrie", maxim: 30, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  const adresa = new URL(cerere.url);
  let f = adresa.searchParams.get("f") ?? "";
  let s = adresa.searchParams.get("s") ?? "";
  let dinPagina = false;
  const formular = await formularCuLimita(cerere, 4096).catch(() => null);
  if (formular?.get("f")) {
    f = String(formular.get("f"));
    s = String(formular.get("s") ?? "");
    dinPagina = true;
  }
  if (!refuzValid(f, s) || !areBazaDeDate()) {
    return dinPagina ? trimiteLa("/nu-mai-scrie?eroare=1") : new Response("Link nevalid.", { status: 400 });
  }
  const fi = await citesteFirma(f);
  if (fi && (await opresteEmailurile(f, "firma, din linkul din e-mail"))) {
    await notificaPanoul({
      titlu: `${fi.denumire} nu mai vrea e-mailuri`,
      text: "A apăsat „Nu mai doresc mesaje”.",
      adresa: `/admin/firme/${f}/mesaje`,
    }).catch(() => 0);
    await trimiteEmail({
      catre: CATRE_ASOCIATIE,
      subiect: `${fi.denumire} nu mai vrea e-mailuri de la noi`,
      html: paginaInterna(
        "O firmă nu mai vrea e-mailuri",
        `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;color:#232323;"><strong>${curat(fi.denumire)}</strong> a apăsat „Nu mai doresc mesaje”. Panoul nu-i mai trimite nimic.</p><p style="margin:0;font-family:Arial,sans-serif;font-size:15px;"><a href="${ADRESA_SITE}/admin/firme/${f}/mesaje" style="color:#b82b09;font-weight:bold;">Vezi discuția</a></p>`,
      ),
      text: `${fi.denumire} a apăsat „Nu mai doresc mesaje”. Panoul nu-i mai trimite nimic.`,
    }).catch(() => false);
  }
  return dinPagina ? trimiteLa("/nu-mai-scrie?gata=1") : new Response("ok");
}
