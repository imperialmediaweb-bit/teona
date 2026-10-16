import { limitaDeRata, raspuns, text as curataText } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  campanii,
  profilulDonatorilor,
  profilulFirmelor,
} from "@/lib/analiza/cifre";
import { rezumat } from "@/lib/analiza/intreaba";
import {
  SEMNE_INTREBARE,
  SCHIMBURI,
  areSfatuitor,
  raspundeSfatuitor,
  type Schimb,
} from "@/lib/analiza/sfatuitor";
import { vizite } from "@/lib/ga/raport";

/**
 * Întrebările către consultantul de strângere de fonduri.
 *
 * **Ce pleacă spre model.** Numai textul construit de `rezumat()` —
 * numărători, sume, procente — plus conversația. Niciun nume, niciun e-mail,
 * niciun telefon, nicio donație individuală. Ruta e singurul loc prin care
 * datele ies către API, și e scurtă dinadins: ce trimite se vede dintr-o
 * privire.
 *
 * **De ce o limită, deși e în spatele parolei.** Fiecare întrebare costă o
 * cerere plătită. Parola o au câțiva oameni din asociație, dar un buton
 * apăsat de treizeci de ori din nerăbdare costă la fel ca unul apăsat de
 * treizeci de ori cu rea intenție.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-sfatuitor",
    maxim: 40,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!areSfatuitor()) {
    return raspuns("Lipsește ANTHROPIC_API_KEY din Railway.", 503);
  }

  const corp = (await cerere.json().catch(() => null)) as {
    conversatie?: unknown;
  } | null;
  if (!corp || !Array.isArray(corp.conversatie)) {
    return raspuns("Cerere invalidă.", 400);
  }

  /*
    Conversația, curățată aici, nu în browser.

    Ce vine dintr-un `fetch` poate fi scris de mână, iar de aici pleacă spre
    un API plătit. Se păstrează numai rolurile știute și textele de lungime
    omenească, cel mult ultimele `SCHIMBURI * 2`.
  */
  const conversatie: Schimb[] = [];
  for (const s of corp.conversatie.slice(-SCHIMBURI * 2)) {
    if (typeof s !== "object" || s === null) continue;
    const { rol, text } = s as { rol?: unknown; text?: unknown };
    if (rol !== "om" && rol !== "consultant") continue;
    const curat = curataText(String(text ?? ""), SEMNE_INTREBARE);
    if (!curat) continue;
    conversatie.push({ rol, text: curat });
  }

  const ultima = conversatie.at(-1);
  if (!ultima || ultima.rol !== "om") {
    return raspuns("Scrie o întrebare.", 400);
  }
  if (
    String((corp.conversatie.at(-1) as { text?: string })?.text ?? "").length >
    SEMNE_INTREBARE
  ) {
    return raspuns(
      `Întrebarea e prea lungă. Scrie-o în cel mult ${SEMNE_INTREBARE} de semne.`,
      400,
    );
  }

  const [donatori, firme, deVizite, deCampanii] = await Promise.all([
    profilulDonatorilor(),
    profilulFirmelor(),
    vizite().catch(() => null),
    campanii().catch(() => null),
  ]);
  const cifre = rezumat(donatori, firme, deVizite, deCampanii);

  const flux = new ReadableStream<Uint8Array>({
    async start(coada) {
      const scrie = new TextEncoder();
      try {
        for await (const bucata of raspundeSfatuitor(cifre, conversatie)) {
          coada.enqueue(scrie.encode(bucata));
        }
      } catch {
        coada.enqueue(
          scrie.encode("\n\n(S-a întrerupt legătura. Mai încearcă o dată.)"),
        );
      }
      coada.close();
    },
  });

  return new Response(flux, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      // Fără asta, un proxy care adună răspunsul îl trimite tot deodată, iar
      // scrisul bucată cu bucată nu se mai vede.
      "x-accel-buffering": "no",
    },
  });
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
