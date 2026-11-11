import { probaAreVoie } from "@/lib/proba";
import { formularAdmin, limitaDeRata, nuTrece, raspuns, sesiuneExpirata, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { hotaraste, stergeSpam } from "@/lib/campanii";
import { campanieHotarata } from "@/lib/email/campanie";

/** Publicarea sau respingerea unei campanii, din lista de verificare. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-campanii",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/aniversari"))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const { formular } = citit;

  const id = String(formular.get("id") ?? "");
  if (!(await probaAreVoie("campanii_aniversare", id))) return new Response("Proba lucrează numai pe rândurile ei.", { status: 403 });
  const hotarare = String(formular.get("hotarare") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return nuTrece("Campanie necunoscută.");
  if (hotarare === "spam") {
    await stergeSpam(id);
    return trimiteLa("/admin/aniversari");
  }
  if (hotarare !== "publicata" && hotarare !== "respinsa") {
    return nuTrece("Hotărâre necunoscută.");
  }

  const motiv = String(formular.get("motiv") ?? "") || undefined;
  const rand = await hotaraste(id, hotarare, motiv);

  // `hotaraste` întoarce rândul doar dacă starea chiar s-a schimbat acum, deci
  // o a doua apăsare pe buton nu mai trimite al doilea e-mail.
  let anuntat = true;
  if (rand) {
    anuntat = await campanieHotarata({
      ...rand,
      publicata: hotarare === "publicata",
      motiv,
    }).catch(() => false);
  }
  // Campania e hotărâtă oricum; dacă e-mailul către om n-a plecat, panoul o
  // spune, ca cineva să-i trimită linkul altfel — altfel nu afla nimeni.
  return trimiteLa(
    `/admin/aniversari?gata=${hotarare}${anuntat ? "" : `&fara_email=${encodeURIComponent(rand?.email ?? "")}`}`,
  );
}
