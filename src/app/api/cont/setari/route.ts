import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { donatorulConectat } from "@/lib/sesiune";
import { schimbaAcordul, uitaDonatorul } from "@/lib/plati/donatori";
import { daJosDinBuletin, laBuletin } from "@/lib/buletin";
import { opresteAbonamentul } from "@/lib/plati/stripe";
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
    if (vrea) await laBuletin(email).catch(() => undefined);
    else await daJosDinBuletin(email).catch(() => undefined);
    return NextResponse.redirect(
      new URL(`/contul-meu?gata=${vrea ? "abonat" : "dezabonat"}`, cerere.url),
      { status: 303 },
    );
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
      return NextResponse.redirect(
        new URL("/contul-meu?eroare=abonament", cerere.url),
        { status: 303 },
      );
    }
    const oprit = await opresteAbonamentul(email, id).catch(() => false);
    return NextResponse.redirect(
      new URL(
        `/contul-meu?${oprit ? "gata=oprita" : "eroare=abonament"}`,
        cerere.url,
      ),
      { status: 303 },
    );
  }

  if (ce === "stergere") {
    // Confirmarea e scrisă de mână, nu bifată: ștergerea nu se poate anula,
    // iar o bifă se apasă din greșeală.
    if (
      String(formular.get("confirmare") ?? "")
        .trim()
        .toUpperCase() !== "ȘTERGE"
    ) {
      return NextResponse.redirect(
        new URL("/contul-meu?eroare=confirmare", cerere.url),
        { status: 303 },
      );
    }
    await daJosDinBuletin(email).catch(() => undefined);
    await uitaDonatorul(email);
    await inchideSesiunea();
    return NextResponse.redirect(new URL("/?sters=1", cerere.url), {
      status: 303,
    });
  }

  return raspuns("Cerere invalidă.", 400);
}
