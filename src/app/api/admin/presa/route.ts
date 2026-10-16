import { NextResponse } from "next/server";
import { limitaDeRata, raspuns, text } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  adaugaContactPresa,
  esteFelPresa,
  schimbaContactPresa,
  stergeContactPresa,
} from "@/lib/presa";

/** Lista de presă: adăugare, schimbare, ștergere. */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-presa",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const camp = (nume: string) => text(formular.get(nume), 300);
  const ce = String(formular.get("ce") ?? "");
  const id = String(formular.get("id") ?? "");

  if (ce === "sterge") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Contact necunoscut.", 400);
    await stergeContactPresa(id);
    return inapoi(cerere);
  }

  const publicatie = camp("publicatie");
  if (!publicatie) return inapoi(cerere, "fara-nume");

  const felScris = String(formular.get("fel") ?? "online");
  const date = {
    publicatie,
    fel: esteFelPresa(felScris) ? felScris : ("online" as const),
    email: camp("email"),
    telefon: camp("telefon"),
    persoana: camp("persoana"),
    site: camp("site"),
    notite: text(formular.get("notite"), 1_000),
  };

  if (ce === "schimba") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return raspuns("Contact necunoscut.", 400);
    await schimbaContactPresa(id, {
      ...date,
      activ: formular.get("activ") === "da",
    });
    return inapoi(cerere);
  }

  await adaugaContactPresa(date);
  return inapoi(cerere);
}

function inapoi(cerere: Request, gresit?: string) {
  const unde = new URL("/admin/presa", cerere.url);
  if (gresit) unde.searchParams.set("ratat", gresit);
  return NextResponse.redirect(unde, 303);
}
