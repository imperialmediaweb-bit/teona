/**
 * Blocurile din care se compune e-mailul de campanie.
 *
 * Fără dependențe de server: le citește și editorul din browser
 * (`componente/admin/CompunereEmail.tsx`). Aceeași lecție ca la tipul
 * `Cifra`: un import din `campanie-sabloane.ts` ar trage după el
 * curățătorul de HTML în pachetul trimis browserului.
 */
export type FelSablon = "persoane" | "firme";

export type Bloc = { id: string; eticheta: string };

/**
 * Blocurile gata făcute ale fiecărui șablon, în ordinea din e-mail.
 * Subsolul legal, cu dezabonarea, nu e în listă: apare mereu.
 */
export const BLOCURI: Record<FelSablon, readonly Bloc[]> = {
  persoane: [
    { id: "donez", eticheta: "Butonul mare „Donez acum”" },
    { id: "sume", eticheta: "Butoanele 20 / 50 / 100 lei" },
    { id: "lunar", eticheta: "Caseta „Donez lunar”" },
    { id: "campanii", eticheta: "Card cu poză: campaniile deschise" },
    { id: "tabere", eticheta: "Card cu poză: taberele RESPIRO" },
    { id: "redirectionare", eticheta: "Redirecționează 3,5%" },
    { id: "sms", eticheta: "SMS cu SUSTIN la 8835" },
    { id: "ziuata", eticheta: "Campanie de ziua ta" },
    { id: "voluntar", eticheta: "Vino voluntar" },
    { id: "galantom", eticheta: "Galantom" },
    { id: "transfer", eticheta: "Transfer bancar, cu conturile" },
    { id: "distribuie", eticheta: "Distribuie pe Facebook și WhatsApp" },
    { id: "cifre", eticheta: "Banda cu cifrele asociației" },
  ],
  firme: [
    { id: "sponsorizez", eticheta: "Butonul mare „Vreau să sponsorizez”" },
    { id: "regula", eticheta: "Caseta cu 20% / 0,75% și calculatorul" },
    { id: "pasi", eticheta: "Cei trei pași" },
    { id: "documente", eticheta: "Contractul și Declarația 177" },
    { id: "primeste", eticheta: "Ce primește firma" },
    { id: "tabere", eticheta: "Card cu poză: taberele RESPIRO" },
    { id: "campanii", eticheta: "Card cu poză: campaniile deschise" },
    { id: "contact", eticheta: "„Hai să vorbim”: telefonul și e-mailul" },
    { id: "cifre", eticheta: "Banda cu cifrele asociației" },
  ],
};

/** Un bloc din e-mailul compus în panou, gata de desenat. */
export type BlocEmail =
  | { tip: "gata"; id: string }
  | { tip: "text"; html: string }
  | { tip: "buton"; eticheta: string; adresa: string; culoare: "portocaliu" | "turcoaz" }
  | { tip: "poza"; adresa: string; alt: string };

/** Ordinea din fabrică: toate blocurile gata făcute. */
export function compozitieImplicita(fel: FelSablon): BlocEmail[] {
  return BLOCURI[fel].map((b) => ({ tip: "gata", id: b.id }));
}
