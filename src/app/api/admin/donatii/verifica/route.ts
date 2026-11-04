import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areStripe } from "@/lib/plati/stripe";
import { verificaPlatileStripe } from "@/lib/plati/confirmare";

/**
 * „Verifică plățile la Stripe”, din panou: întreabă Stripe despre toate
 * plățile cu cardul pornite pe site în ultimele 30 de zile și rămase
 * neconfirmate, și le trece în evidență pe cele plătite (cu mulțumirea și
 * anunțurile de rigoare). Plasa de siguranță pentru un webhook care n-a ajuns.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-verifica-stripe",
    maxim: 10,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/donatii"))) return raspuns("Nu ai acces.", 403);
  if (!areStripe()) return trimiteLa("/admin/donatii?verificat=fara-stripe");

  try {
    const { verificate, confirmate } = await verificaPlatileStripe(true);
    return trimiteLa(`/admin/donatii?verificat=${confirmate}&din=${verificate}`);
  } catch {
    return trimiteLa(
      `/admin/donatii?eroare=${encodeURIComponent("Stripe nu a răspuns. Încearcă peste un minut.")}`,
    );
  }
}
