import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";

import { esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  profilulDonatorilor,
  profilulFirmelor,
  salveazaAnaliza,
} from "@/lib/analiza/cifre";
import { areAnaliza, cereAnaliza, rezumat } from "@/lib/analiza/intreaba";

/**
 * Cere o analiză nouă.
 *
 * **Limita e strânsă dinadins: trei pe oră.** Fiecare apăsare costă o cerere
 * plătită către model, iar cifrele asociației nu se schimbă de la un minut la
 * altul — o analiză pe săptămână spune la fel de mult ca una pe zi. Analiza
 * veche rămâne pe pagină; butonul nu e un buton de reîmprospătare.
 *
 * Către model pleacă numai agregatele construite de `rezumat()` — numărători,
 * sume și procente, niciun nume și niciun e-mail. Textul trimis se salvează
 * lângă răspuns, ca să se poată verifica oricând ce a plecat.
 *
 * Răspunsul e o întoarcere pe pagină, nu JSON: butonul e un formular obișnuit,
 * care merge și cu JavaScript oprit, iar ce n-a mers se citește de pe pagină,
 * nu dintr-o consolă pe care nimeni n-o deschide.
 */

/** Înapoi la pagină, cu motivul în adresă dacă n-a mers. */
function inapoi(cerere: Request, motiv: string | null) {
  const unde = new URL("/admin/analiza", cerere.url);
  if (motiv) unde.searchParams.set("ratat", motiv);
  return NextResponse.redirect(unde, { status: 303 });
}
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-analiza",
    maxim: 3,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!areAnaliza()) return inapoi(cerere, "fara-cheie");

  const [donatori, firme] = await Promise.all([
    profilulDonatorilor(),
    profilulFirmelor(),
  ]);

  /*
    Prea puține date, nicio analiză.

    Pe zece donații, orice tipar e zgomot. Mai bine un mesaj limpede decât o
    analiză care sună bine și trimite un om să muncească o săptămână
    într-o direcție scoasă din trei rânduri de tabel.
  */
  if (donatori.donatii < 20 && firme.firme < 5) {
    return inapoi(cerere, "putine-date");
  }

  const cifre = rezumat(donatori, firme);
  const text = await cereAnaliza(cifre);
  if (!text) return inapoi(cerere, "n-a-mers");

  await salveazaAnaliza(text, cifre).catch(() => undefined);
  return inapoi(cerere, null);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
