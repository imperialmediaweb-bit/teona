import { limitaDeRata, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune, numeleConectat } from "@/lib/admin";
import { esteFelInteractiune, scrieInteractiune } from "@/lib/crm";

/**
 * Scrie un rând în jurnalul discuțiilor.
 *
 * `inapoi` spune unde se întoarce omul după salvare — lista din care a
 * deschis jurnalul, cu filtrele ei cu tot. Vine dintr-un câmp de formular,
 * deci din afară: se acceptă numai o cale din panou, altfel răspunsul ar
 * putea fi folosit ca trambulină de redirecționare către alt sit.
 *
 * Calea aia e și **dreptul cerut**. Jurnalul se scrie din trei liste —
 * firme, donatori, cereri — și un rând de jurnal spune ceva despre omul sau
 * firma din lista respectivă. Verificat o dată, pentru pagina de unde se
 * scrie, în loc de un drept comun care ar lăsat ruta deschisă pentru cine
 * n-are voie pe niciuna dintre cele trei.
 */
const INAPOI = /^\/admin\/(firme|donatori|cereri)(\?[\w=&%.\-+]*)?$/;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-jurnal",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const cerut = String(formular.get("inapoi") ?? "");
  const potrivit = INAPOI.exec(cerut);
  // Fără o cale cunoscută nu știm nici unde se întoarce omul, nici ce drept
  // să cerem. Mai bine un refuz decât un drept ghicit.
  if (!potrivit) return raspuns("Cerere invalidă.", 400);
  const inapoi = cerut;

  if (!(await arePermisiune(`/admin/${potrivit[1]}`))) {
    return raspuns("Nu ai acces.", 403);
  }

  const fel = formular.get("fel");
  if (!esteFelInteractiune(fel)) return raspuns("Fel necunoscut.", 400);

  const rezumat = text(formular.get("rezumat"), 2_000);
  if (!rezumat) return raspuns("Scrie ce s-a vorbit.", 400);

  const email = String(formular.get("email") ?? "").trim() || undefined;
  const firmaId = String(formular.get("firma_id") ?? "").trim() || undefined;
  if (firmaId && !/^[0-9a-f-]{36}$/i.test(firmaId)) {
    return raspuns("Firmă necunoscută.", 400);
  }
  if (!email && !firmaId) return raspuns("Cerere invalidă.", 400);

  /*
    Cine a scris rândul.

    Numele vine din sesiune, nu din formular: altfel ar fi un câmp în care
    scrii ce vrei, iar „l-a sunat Maria" n-ar mai însemna nimic. Când se intră
    cu parola asociației, în loc de nume se scrie „Asociația" — mai cinstit
    decât un nume ghicit, și se vede din listă că rândul ăla vine de dinainte
    de conturi, sau de la cheia comună.
  */
  const scris = await scrieInteractiune({
    email,
    firmaId,
    fel,
    rezumat,
    scrisDe: (await numeleConectat()) ?? undefined,
  });
  if (!scris) return raspuns("Nu am putut salva.", 502);

  const cheie = firmaId ?? email ?? "";
  const separator = inapoi.includes("?") ? "&" : "?";

  return trimiteLa(`${inapoi}${separator}deschis=${encodeURIComponent(cheie)}${firmaId ? `#${firmaId}` : ""}`);
}
