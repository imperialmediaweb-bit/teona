import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { donatorulConectat } from "@/lib/sesiune";
import { schimbaAcordul, uitaDonatorul } from "@/lib/plati/donatori";
import { daJosDinBuletin, laBuletin } from "@/lib/buletin";
import {
  abonamenteleLui,
  areStripe,
  opresteAbonamentul,
  opresteAbonamentulDupaId,
} from "@/lib/plati/stripe";
import { inchideSesiunea } from "@/lib/sesiune";

/**
 * Ce poate schimba donatorul despre el însuși: acordul pentru buletin și
 * ștergerea datelor.
 *
 * Adresa vine **numai** din sesiunea verificată, niciodată din formular.
 * Altfel oricine ar putea trimite o cerere cu adresa altcuiva și i-ar șterge
 * datele.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "cont-setari",
    maxim: 20,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const email = await donatorulConectat();
  if (!email) return raspuns("Nu ești conectat.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const ce = String(formular.get("ce") ?? "");

  if (ce === "buletin") {
    const vrea = formular.get("acord") === "da";
    await schimbaAcordul(email, vrea);
    // MailerLite ține lista; baza noastră ține dovada acordului. Trebuie
    // schimbate amândouă, altfel omul se dezabonează de pe site și
    // primește în continuare.
    // Rezultatul contează: cu MailerLite căzut, „Gata, nu mai primești
    // buletinul” era o minciună — omul rămânea activ pe listă.
    const ok = vrea
      ? await laBuletin(email, "persoane", null, "cont").catch(() => false)
      : await daJosDinBuletin(email).catch(() => false);
    if (!ok) return trimiteLa("/contul-meu?eroare=buletin");
    return trimiteLa(`/contul-meu?gata=${vrea ? "abonat" : "dezabonat"}`);
  }

  if (ce === "opreste-lunara") {
    /*
      Oprirea donației lunare, de aici, nu printr-un e-mail către asociație.

      Până acum panoul scria „scrie-ne sau sună și o oprim". Era adevărat, dar
      punea între om și banii lui un drum pe care trebuia să-l facă el, la
      ora la care răspunde cineva. Un om care vrea să nu mai dea bani și nu
      găsește butonul nu scrie: sună la bancă și blochează plata, iar
      asociația află din Stripe, ca dispută.

      `opresteAbonamentul` verifică întâi că abonamentul e chiar al lui:
      identificatorul vine din formular, deci poate fi schimbat în browser.
    */
    const id = String(formular.get("abonament") ?? "");
    if (!/^sub_[A-Za-z0-9]+$/.test(id)) {
      return trimiteLa("/contul-meu?eroare=abonament");
    }
    const oprit = await opresteAbonamentul(email, id).catch(() => false);
    return trimiteLa(`/contul-meu?${oprit ? "gata=oprita" : "eroare=abonament"}`);
  }

  if (ce === "stergere") {
    // Confirmarea e scrisă de mână, nu bifată: ștergerea nu se poate anula,
    // iar o bifă se apasă din greșeală.
    if (
      String(formular.get("confirmare") ?? "")
        .trim()
        .toUpperCase() !== "ȘTERGE"
    ) {
      return trimiteLa("/contul-meu?eroare=confirmare");
    }
    // Dacă lista de e-mail nu răspunde, nu se șterge nimic: altfel omul ar
    // dispărea din baza noastră și ar primi buletinul mai departe.
    const scos = await daJosDinBuletin(email).catch(() => false);
    if (!scos) return trimiteLa("/contul-meu?eroare=stergere");
    /*
      Donația lunară se oprește odată cu ștergerea. Lăsată pornită, plata
      următoare scria la loc adresa, prenumele și telefonul din metadatele
      abonamentului — datele „șterse” reapăreau peste o lună (audit 11 nov.
      2026). Dacă Stripe nu răspunde sau o oprire nu merge, nu se șterge
      nimic: omul află și încearcă din nou, în loc să rămână cu un abonament
      pe care nu-l mai poate vedea.
    */
    if (areStripe()) {
      const aleLui = await abonamenteleLui(email).catch(() => null);
      if (aleLui === null) return trimiteLa("/contul-meu?eroare=stergere");
      for (const a of aleLui) {
        const oprit = await opresteAbonamentulDupaId(a.id).catch(() => false);
        if (!oprit) return trimiteLa("/contul-meu?eroare=stergere");
      }
    }
    await uitaDonatorul(email);
    await inchideSesiunea();
    return trimiteLa("/?sters=1");
  }

  return raspuns("Cerere invalidă.", 400);
}
