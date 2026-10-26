import { limitaDeRata, raspuns, trimiteLa } from "@/lib/api";
import { arePermisiune } from "@/lib/admin";
import { hotarasteTransfer } from "@/lib/plati/donatori";
import { trimiteMultumirea } from "@/lib/email/donatie";

/**
 * Confirmarea unui transfer anunțat de donator.
 *
 * Donatorul spune pe site că a făcut transferul; anunțul lui nu se numără
 * nicăieri. Aici, după ce cineva l-a găsit în extrasul de cont, devine
 * donație adevărată — sau se respinge, dacă banii n-au ajuns niciodată.
 *
 * Confirmarea e singurul loc în care o sumă venită dintr-un formular public
 * intră în totalurile asociației. De asta trece prin panou, cu parolă, și nu
 * se întâmplă singură.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-transfer",
    maxim: 120,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/donatii"))) return raspuns("Nu ai acces.", 403);

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return raspuns("Cerere invalidă.", 400);

  const inapoi = (parametru: string) =>
    trimiteLa(`/admin/donatii?${parametru}`);

  const id = String(formular.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return inapoi(`eroare=${encodeURIComponent("Transfer necunoscut.")}`);
  }

  const hotarare = String(formular.get("hotarare") ?? "");
  if (hotarare !== "confirma" && hotarare !== "respinge") {
    return inapoi(`eroare=${encodeURIComponent("Hotărâre necunoscută.")}`);
  }

  const confirma = hotarare === "confirma";
  const donatia = await hotarasteTransfer(id, confirma);

  if (!donatia) {
    return inapoi(
      `eroare=${encodeURIComponent(
        "Transferul ăsta a fost deja rezolvat — poate de altcineva, între timp.",
      )}`,
    );
  }

  /*
    Mulțumirea, abia acum.

    Donatorul a primit un mesaj când a anunțat transferul („îl căutăm în
    extras"). Ăsta e al doilea, și e singurul care mulțumește: până aici nu
    văzuse nimeni banii. Pleacă doar la confirmare — la respingere n-avem ce
    să mulțumim, iar un mesaj automat care spune „nu l-am găsit" e o
    conversație de purtat la telefon, nu de trimis de un server.

    Fără adresă de e-mail nu pleacă nimic: la un transfer bancar câmpul e
    opțional, fiindcă donația e deja făcută și n-avem de ce să cerem o adresă
    ca să primim bani.
  */
  if (confirma && donatia.email) {
    await trimiteMultumirea({
      email: donatia.email,
      prenume: donatia.nume?.trim().split(/\s+/)[0] ?? null,
      nume: donatia.nume,
      sumaBani: donatia.sumaBani,
      moneda: "RON",
      frecventa: "o-data",
      destinatie: donatia.destinatie,
      cand: donatia.cand,
      prinTransfer: true,
    });
  }

  return inapoi(confirma ? "gata=1" : "respins=1");
}
