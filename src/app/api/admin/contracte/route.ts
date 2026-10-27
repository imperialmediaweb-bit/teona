import { limitaDeRata, nuTrece, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { esteStadiuContract, schimbaContract } from "@/lib/contracte";
import { citesteSuma } from "@/lib/suma";
import { inBani } from "@/date/plati";

/** Schimbarea unui rând din registrul contractelor. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-contracte",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/contracte"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return nuTrece("Contract necunoscut.");

  const stadiuScris = String(formular.get("stadiu") ?? "");
  if (!esteStadiuContract(stadiuScris)) {
    return nuTrece("Stadiu necunoscut.");
  }

  const valoareScrisa = String(formular.get("valoare") ?? "").trim();
  let valoareBani: number | null = null;
  if (valoareScrisa) {
    const { suma, eroare } = citesteSuma(valoareScrisa);
    if (eroare || suma === null) return inapoi(cerere, formular, "suma");
    valoareBani = inBani(suma);
  }

  const zi = String(formular.get("data") ?? "").trim();
  if (zi && !/^\d{4}-\d{2}-\d{2}$/.test(zi)) {
    return inapoi(cerere, formular, "data");
  }

  await schimbaContract(id, {
    stadiu: stadiuScris,
    valoareBani,
    dataContract: zi || null,
    observatii: text(formular.get("observatii"), 1_000),
  });

  return inapoi(cerere, formular);
}

function inapoi(cerere: Request, formular: FormData, gresit?: string) {
  const unde = new URL("/admin/contracte", cerere.url);
  const an = String(formular.get("an") ?? "");
  if (/^\d{4}$/.test(an)) unde.searchParams.set("an", an);
  if (gresit) unde.searchParams.set("ratat", gresit);
  return trimiteLa(unde);
}
