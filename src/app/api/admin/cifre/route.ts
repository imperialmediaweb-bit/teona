import { revalidateTag } from "next/cache";
import { limitaDeRata, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import {
  CIFRE_DIN_COD,
  ETICHETA_CIFRE,
  schimbaCifrele,
  type Cifra,
} from "@/lib/cifre";

/**
 * Cele patru cifre, schimbate din panou.
 *
 * Caietul cere ca ele să fie „aceleași peste tot", deci după salvare se
 * golește eticheta de cache: altfel prima pagină ar arăta cifra veche încă o
 * oră, iar omul ar crede că n-a salvat.
 */

const INAPOI = "/admin/cifre";

function gata(cerere: Request, cod: string) {
  return trimiteLa(`${INAPOI}?stare=${encodeURIComponent(cod)}#stare`);
}

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-cifre",
    maxim: 30,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune(INAPOI))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const cifre: Cifra[] = [];
  for (let i = 0; i < CIFRE_DIN_COD.length; i++) {
    /*
      Cifra se citește strict.

      „1.500" scris cu punct de mii ar deveni 1 la `parseInt`, iar pagina ar
      arăta „1 participanți" fără nicio eroare. De aceea punctele și spațiile
      se scot înainte, iar orice altceva decât cifre e refuzat — pagina spune
      ce e greșit și nu salvează nimic.
    */
    const brut = (text(formular.get(`valoare-${i}`), 20) ?? "").replace(
      /[.\s]/g,
      "",
    );
    if (!/^\d{1,9}$/.test(brut)) return gata(cerere, "cifra");

    const eticheta = text(formular.get(`eticheta-${i}`), 60) ?? "";
    if (!eticheta) return gata(cerere, "eticheta");

    /* Sufixul e un semn, nu un text: „+" sau nimic. */
    const sufix = (text(formular.get(`sufix-${i}`), 3) ?? "").replace(
      /[^+]/g,
      "",
    );

    cifre.push({ valoare: Number(brut), sufix, eticheta });
  }

  const schimbat = await schimbaCifrele(cifre).catch(() => false);
  if (schimbat) revalidateTag(ETICHETA_CIFRE, "max");
  return gata(cerere, schimbat ? "schimbat" : "necunoscut");
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
