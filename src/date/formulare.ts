/**
 * Opțiunile celor două formulare fiscale.
 *
 * Stau aici, nu în componentă și nu în rută, pentru că le citesc amândouă:
 * butoanele din browser și verificarea de pe server. Dacă ar fi scrise de
 * două ori, o etichetă schimbată într-un loc ar face ca formularul să fie
 * respins cu „alege una dintre cele două căi” pentru o alegere care, pe
 * ecran, arată perfect validă.
 *
 * `src/date/` nu are voie să atingă `node:` — fișierele de aici ajung și în
 * componente de browser.
 */

/** 8.2 — cele două căi prin care o firmă poate sponsoriza. */
export const CAI_SPONSORIZARE = [
  {
    valoare: "Declarația 177",
    eticheta: "Declarația 177",
    pictograma: "document",
  },
  {
    valoare: "Contract de sponsorizare",
    eticheta: "Contract de sponsorizare",
    pictograma: "cladire",
  },
  {
    valoare: "Nu știu încă, ajutați-mă să aleg",
    eticheta: "Nu știu încă",
    pictograma: "comunicare",
  },
] as const;

/** 7 — cum preferă omul să completeze Formularul 230. */
export const PREFERINTE_REDIRECTIONARE = [
  {
    valoare: "Completez online",
    eticheta: "Completez online",
    pictograma: "document",
  },
  {
    valoare: "Vreau formularul pe hârtie",
    eticheta: "Pe hârtie",
    pictograma: "plic",
  },
] as const;

/**
 * Ce urmează după cererea de sponsorizare, după calea aleasă de firmă.
 *
 * Până pe 11 noiembrie 2026 ecranul, e-mailul către firmă și anunțul intern
 * spuneau toate „contractul de sponsorizare”, orice ar fi ales firma — iar la
 * Declarația 177 contractul e altul (`/documente/contract-declaratia-177`).
 * Scris o dată, ca cele trei locuri să nu mai poată spune lucruri diferite.
 * `cine` e omul de la fundraising, cu rolul lui dacă e nevoie.
 */
export function pasulUrmatorSponsorizare(cale: string, cine: string): string {
  if (cale === "Declarația 177")
    return `Vă scrie ${cine} cu contractul pentru Declarația 177, completat cu datele noastre.`;
  if (cale === "Contract de sponsorizare")
    return `Vă scrie ${cine} cu contractul de sponsorizare completat cu datele noastre.`;
  return `Vă scrie sau vă sună ${cine}, ca să alegem împreună calea potrivită firmei dumneavoastră.`;
}
