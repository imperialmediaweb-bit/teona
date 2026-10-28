import { limitaDeRata, raspuns } from "@/lib/api";
import { arePermisiune, sesiuneProaspata } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  caTabel,
  dateleListei,
  esteLista,
  numeleFisierului,
} from "@/lib/export-csv";

/**
 * O listă din panou, descărcată ca fișier pentru Excel.
 *
 * **Fișierele astea conțin date personale** — nume, adrese de e-mail, sume.
 * De aceea ruta cere autentificare ca orice altceva din panou, răspunsul nu se
 * ține în niciun cache, iar numărul de descărcări pe zece minute e limitat:
 * un export nu e un lucru pe care îl faci de o sută de ori pe minut, dar e
 * exact lucrul pe care cineva cu o parolă furată l-ar face o dată.
 */
export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-export",
    maxim: 20,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  const lista = new URL(cerere.url).searchParams.get("ce");
  if (!esteLista(lista)) return raspuns("Listă necunoscută.", 400);

  /*
    Dreptul cerut e al paginii din care se exportă, nu unul singur pentru toată
    ruta.

    Cele patru liste sunt exact patru pagini de panou — donații, donatori,
    firme, cereri —, iar fișierul scos are în el aceleași nume și adrese care
    se văd pe ele. Un drept comun ar fi însemnat că cine n-are voie pe o
    pagină o descarcă întreagă de la adresa asta, cu tot cu datele personale,
    și fără să i-o arate nimeni în meniu.
  */
  if (!(await arePermisiune(`/admin/${lista}`))) {
    return raspuns("Nu ai acces.", 403);
  }

  // Fișierul pleacă din panou cu nume și adrese: cere o confirmare proaspătă.
  if (!(await sesiuneProaspata())) {
    return raspuns(
      "Pentru descărcare, intră din nou în panou (parola sau codul). Au trecut mai mult de 12 ore de la ultima intrare.",
      403,
    );
  }

  const { antet, randuri } = await dateleListei(lista);

  return new Response(caTabel(antet, randuri), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${numeleFisierului(lista)}"`,
      "cache-control": "no-store",
    },
  });
}
