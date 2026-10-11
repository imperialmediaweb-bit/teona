import { NextResponse } from "next/server";
import { limitaDeRata } from "@/lib/api";
import { foloseșteJeton } from "@/lib/cont";
import { deschideSesiunea } from "@/lib/sesiune";

/**
 * Capătul linkului din e-mail: consumă jetonul și deschide sesiunea.
 *
 * E o rută, nu o pagină, din două motive. Jetonul nu trebuie să rămână în
 * adresa barei după ce a fost folosit — ar ajunge în istoric și, dacă pagina
 * ar avea vreun link extern, în antetul `Referer`. Și cookie-ul trebuie pus
 * într-un răspuns, ceea ce o pagină randată nu poate face curat.
 *
 * După consum, omul e dus la `/contul-meu` fără niciun parametru.
 */
export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "cont-intra",
    maxim: 20,
    fereastraMs: 15 * 60 * 1000,
  });
  if (prea) return prea;

  const jeton = new URL(cerere.url).searchParams.get("jeton") ?? "";
  const email = await foloseșteJeton(jeton).catch(() => null);

  if (!email) {
    return NextResponse.redirect(
      new URL("/contul-meu?expirat=1", cerere.url),
      { status: 303 },
    );
  }

  await deschideSesiunea(email);
  return NextResponse.redirect(new URL("/contul-meu", cerere.url), {
    status: 303,
  });
}
