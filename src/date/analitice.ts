/**
 * Google Analytics 4.
 *
 * Identificatorul e public — apare oricum în sursa paginii, la vedere — deci
 * stă în cod, nu în Railway. `NEXT_PUBLIC_ANALITICE` îl poate înlocui, dacă
 * asociația mută vreodată proprietatea; gol oprește statisticile cu totul.
 *
 * **Nu se încarcă nimic fără acord.** Scriptul intră în pagină doar după ce
 * vizitatorul a bifat „statistici” în bannerul de cookie-uri (12.5 din caiet),
 * nu „în mod implicit, dar fără cookie-uri”. Până atunci, Google nu află că
 * omul a fost aici.
 */
export const ANALITICE = (
  process.env.NEXT_PUBLIC_ANALITICE ?? "G-X81X9TJVJ8"
).trim();
