import { formularAdmin, limitaDeRata, nuTrece, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune, numeleConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areEmail, trimiteEmail } from "@/lib/email/trimite";
import { compuneApelul } from "@/lib/email/apel-voluntari";
import { EMAIL } from "@/date/asociatie";
import {
  creeazaApel,
  linkRaspuns,
  scrieIntrebat,
  totiVoluntarii,
} from "@/lib/voluntari";

/**
 * Apelul către voluntari, trimis din panou.
 *
 * Ca la comunicatul de presă, **fiecare voluntar primește e-mailul lui**, cu
 * linkurile lui de răspuns. Identificatorii bifați vin din formular, adresele
 * din baza de date: serverul asociației nu trimite la o adresă scrisă de mână.
 *
 * Apelul se scrie și fără e-mail configurat: în panou rămân linkurile de
 * WhatsApp, cu textul și linkul de răspuns al fiecărui om.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-voluntari-apel",
    maxim: 20,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/voluntari"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

  const titlu = text(formular.get("titlu"), 120);
  if (!titlu) return nuTrece("Scrie pentru ce e nevoie de voluntari (de exemplu: Tabăra de autism).");
  const cand = text(formular.get("cand"), 120);
  if (!cand) return nuTrece("Scrie când: ziua și ora.");
  // Gol e voie; prea lung se refuză, nu se pierde în tăcere (`text()` dă null).
  const undeScris = String(formular.get("unde") ?? "").trim();
  const unde = undeScris ? text(undeScris, 160) : null;
  if (undeScris && !unde) return nuTrece("Locul e prea lung.");
  const mesaj = String(formular.get("mesaj") ?? "").replace(/\r\n/g, "\n").trim();
  if (mesaj.length < 10) return nuTrece("Scrie câteva rânduri: ce vor face voluntarii.");
  if (mesaj.length > 4000) return nuTrece("Mesajul e prea lung.");
  const peEmail = formular.get("pe_email") === "da";

  const alese = new Set(formular.getAll("voluntar").map(String));
  const voluntari = (await totiVoluntarii()).filter((v) => alese.has(v.id));
  if (!voluntari.length) return nuTrece("Bifează cel puțin un voluntar.");
  if (peEmail && !areEmail()) return nuTrece("Trimiterea de e-mailuri nu e configurată pe site.");
  // Un apel e o întrebare către câțiva oameni, nu o campanie.
  if (peEmail && voluntari.length > 50) {
    return nuTrece("Pe e-mail, cel mult 50 de voluntari o dată. Restrânge lista cu filtrele, sau scrie-le pe WhatsApp.");
  }

  const apelId = await creeazaApel({
    titlu,
    cand,
    unde,
    mesaj,
    creatDe: await numeleConectat(),
  });

  let plecate = 0;
  for (const v of voluntari) {
    let trimis = false;
    if (peEmail && v.email) {
      const pot = linkRaspuns(apelId, v.id, "pot");
      const nuPot = linkRaspuns(apelId, v.id, "nu-pot");
      if (pot && nuPot) {
        const compus = compuneApelul(
          { titlu, cand, unde, mesaj },
          v.nume.trim().split(/\s+/)[0] ?? "",
          pot,
          nuPot,
        );
        trimis = await trimiteEmail({
          catre: v.email,
          subiect: compus.subiect,
          html: compus.html,
          text: compus.text,
          raspundeLa: EMAIL.contact,
          masa: true,
        }).catch(() => false);
      }
    }
    if (trimis) plecate++;
    await scrieIntrebat(apelId, v.id, trimis);
  }

  const q = new URLSearchParams({ apel: apelId, intrebati: String(voluntari.length) });
  if (peEmail) q.set("emailuri", String(plecate));
  return trimiteLa(`/admin/voluntari?${q}#apel-${apelId}`);
}
