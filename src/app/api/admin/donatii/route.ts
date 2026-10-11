import { NextResponse } from "next/server";
import { email as citesteEmail, limitaDeRata, raspuns, text } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import {
  adaugaDonatieManuala,
  esteMetodaManuala,
} from "@/lib/plati/donatori";
import { citesteSuma } from "@/lib/suma";
import { DESTINATII, inBani } from "@/date/plati";

/**
 * Scrie o donație care n-a venit printr-un procesator: transfer bancar,
 * numerar, SMS, Galantom.
 *
 * Fără asta, totalul din panou ar fi mereu mai mic decât cel real — iar un
 * total în care nu ai încredere nu-l mai deschizi. Datele se bat de mână,
 * dintr-un extras de cont, deci fiecare câmp e verificat aici: o sumă greșită
 * intră direct în raportul anual.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-donatii",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const inapoi = (mesaj: string) =>
    NextResponse.redirect(
      new URL(`/admin/donatii?eroare=${encodeURIComponent(mesaj)}`, cerere.url),
      { status: 303 },
    );

  const metoda = formular.get("metoda");
  if (!esteMetodaManuala(metoda)) return inapoi("Alege metoda.");

  const referinta = text(formular.get("referinta"), 120);
  if (!referinta) {
    return inapoi(
      "Scrie o referință — numărul extrasului, al chitanței sau data transferului. Ea împiedică trecerea aceleiași donații de două ori.",
    );
  }

  const { suma, eroare } = citesteSuma(String(formular.get("suma") ?? ""));
  if (eroare) return inapoi(eroare);
  if (suma === null || suma <= 0) return inapoi("Scrie suma donației.");

  const destinatie = String(formular.get("destinatie") ?? "oriunde");
  if (!(destinatie in DESTINATII)) return inapoi("Destinație necunoscută.");

  const data = String(formular.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return inapoi("Alege data donației.");
  // Ziua întreagă, la prânz: o donație trecută cu „2026-03-04" nu trebuie să
  // cadă în luna precedentă din cauza fusului orar.
  const cand = new Date(`${data}T12:00:00Z`);
  if (Number.isNaN(cand.getTime())) return inapoi("Data nu e scrisă corect.");
  if (cand.getTime() > Date.now() + 24 * 3600 * 1000) {
    return inapoi("Data e în viitor. Verifică dacă n-a intrat un an greșit.");
  }

  const adresa = String(formular.get("email") ?? "").trim();
  if (adresa && !citesteEmail(adresa)) {
    return inapoi("Adresa de e-mail nu e validă. Lasă câmpul gol dacă n-o ai.");
  }

  const rezultat = await adaugaDonatieManuala({
    metoda,
    referinta,
    sumaBani: inBani(suma),
    destinatie,
    data: cand.toISOString(),
    email: citesteEmail(adresa) ?? undefined,
    nume: text(formular.get("nume"), 120) ?? undefined,
    telefon: text(formular.get("telefon"), 40) ?? undefined,
    observatii: text(formular.get("observatii"), 1_000) ?? undefined,
    adaugatDe: "panou",
  });

  if (!rezultat.ok) {
    return inapoi(
      rezultat.motiv === "duplicat"
        ? `Există deja o donație cu referința „${referinta}" pe metoda asta. Dacă sunt două donații diferite, dă-i alt număr.`
        : "Nu am putut salva donația. Încearcă din nou.",
    );
  }

  return NextResponse.redirect(new URL("/admin/donatii?gata=1", cerere.url), {
    status: 303,
  });
}
