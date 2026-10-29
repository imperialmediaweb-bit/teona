import { semnaturaLinkuluiTine, semneazaText } from "./cheie-semnare";

/**
 * Linkul prin care donatorul își schimbă cardul, când plata lunară cade.
 *
 * **De ce contează.** Un card expiră la trei ani, o bancă îl reemite, un om
 * își schimbă banca. Plata lunară cade, Stripe mai încearcă de câteva ori și
 * apoi oprește abonamentul — iar asociația află abia peste luni, din raport,
 * că „a scăzut ce vine lunar". Donatorul nu știe nimic: el crede că donează
 * în continuare. E cea mai tăcută pierdere de bani dintr-un ONG cu donații
 * recurente, și singura care se repară cu un e-mail.
 *
 * **De ce un link semnat și nu „intră în contul tău".** La fel ca la oprirea
 * donației: drumul prin cont are patru pași, iar omul care n-a putut în
 * treizeci de secunde nu-i face. Linkul duce direct în portalul Stripe, unde
 * se schimbă cardul și atât.
 *
 * **Ce poate cine are linkul.** Deschide portalul de facturare al clientului
 * din el — adică poate schimba cardul, vedea facturile lui și opri donația.
 * Nu deschide contul de pe site, nu arată alte date și nu poate fi întors ca
 * să afle ce are altcineva. Ține 35 de zile, cât să acopere toate
 * reîncercările Stripe, și nici o zi mai mult: un link uitat într-o cutie
 * poștală nu e o cheie pe viață.
 *
 * **Adresa portalului se face la apăsare, nu acum.** Sesiunile Stripe de
 * portal expiră în câteva minute; una pusă într-un e-mail ar fi moartă până
 * să-l deschidă omul. Linkul nostru duce la o rută a noastră, care cere
 * atunci o sesiune proaspătă.
 */

const ZI_MS = 24 * 3600 * 1000;
const VIATA_ZILE = 35;

function semneaza(client: string, expira: number): string | null {
  return semneazaText(`card:${client}:${expira}`);
}

/** Adresa de pus în e-mail, sau `null` dacă n-avem cheie. */
export function linkCardNou(
  adresaSite: string,
  client: string,
): string | null {
  const expira = Date.now() + VIATA_ZILE * ZI_MS;
  const semn = semneaza(client, expira);
  if (!semn) return null;
  const cauta = new URLSearchParams({
    c: client,
    p: String(expira),
    s: semn,
  });
  return `${adresaSite}/actualizeaza-cardul?${cauta}`;
}

export type DovadaCard = { c: string; p: string; s: string };

/** Clientul din link, dacă semnătura ține și n-a expirat. */
export function clientulDinLink(d: Partial<DovadaCard>): string | null {
  const client = (d.c ?? "").trim();
  const expira = Number(d.p);
  const semn = (d.s ?? "").trim();

  if (!/^cus_[A-Za-z0-9]+$/.test(client)) return null;
  if (!Number.isFinite(expira) || expira < Date.now()) return null;

  if (!semnaturaLinkuluiTine(`card:${client}:${expira}`, semn)) return null;
  return client;
}
