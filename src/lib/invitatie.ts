import { semnaturaLinkuluiTine, semneazaText } from "./cheie-semnare";

/**
 * Linkul prin care un om nou își pune singur parola de panou.
 *
 * **Ce înlocuiește.** Până acum, administratorul scria parola altcuiva și i-o
 * trimitea — de obicei pe WhatsApp. Trei lucruri rele dintr-o singură mișcare:
 * parola rămâne scrisă într-o conversație pe care n-o șterge nimeni,
 * administratorul o știe până când (dacă) o schimbă omul, iar omul n-are
 * niciun motiv s-o schimbe, fiindcă merge.
 *
 * Cu invitația, parola n-o știe nimeni în afară de cel care o folosește. Nu e
 * o îmbunătățire de confort: e singura variantă în care fraza „numai tu îți
 * știi parola" din panou e adevărată.
 *
 * **Ce poate cine are linkul.** Să pună parola **acelui** cont, o singură
 * dată, în șapte zile. Nu deschide panoul, nu arată nimic și nu spune nici
 * măcar dacă adresa aia e a cuiva: pagina publică nu scrie numele omului.
 *
 * **Ce îl omoară**, în ordinea în care se întâmplă:
 *
 * - **folosirea** — `invitat_la` se face NULL când se pune parola, iar
 *   semnătura nu se mai potrivește cu nimic;
 * - **o invitație nouă** — clipa se schimbă, deci linkul de acum trei zile
 *   moare pe loc. Altfel ar fi două chei valabile deodată, iar una într-o
 *   cutie poștală la care nu se mai uită nimeni;
 * - **oprirea contului** — toate interogările cer `activ`;
 * - **șapte zile**, oricum. Un cont nou se deschide în aceeași zi sau în
 *   următoarea; o săptămână acoperă un concediu scurt, nu o uitare de un an.
 *
 * **Clipa invitației e în semnătură, nu lângă ea.** Dacă ar fi doar un câmp
 * din adresă, cine are linkul ar putea încerca alte clipe. Așa, orice
 * schimbare a ei face semnătura să nu se mai potrivească.
 */

const ZI_MS = 24 * 3600 * 1000;
const VIATA_ZILE = 7;

function semneaza(
  id: string,
  invitatLa: number,
  expira: number,
): string | null {
  return semneazaText(`invitatie:${id}:${invitatLa}:${expira}`);
}

/** Adresa de pus în e-mail, sau `null` dacă n-avem cheie. */
export function linkInvitatie(
  adresaSite: string,
  id: string,
  invitatLa: Date,
): string | null {
  const clipa = invitatLa.getTime();
  const expira = Date.now() + VIATA_ZILE * ZI_MS;
  const semn = semneaza(id, clipa, expira);
  if (!semn) return null;
  const cauta = new URLSearchParams({
    u: id,
    i: String(clipa),
    p: String(expira),
    s: semn,
  });
  return `${adresaSite}/invitatie?${cauta}`;
}

export type DovadaInvitatie = { u: string; i: string; p: string; s: string };

/**
 * Contul și clipa din link, dacă semnătura ține și n-a expirat.
 *
 * Nu atinge baza de date: spune doar că linkul e al nostru și e în viață.
 * Dacă invitația mai e în aer se află abia la scriere, și tot acolo se și
 * stinge — într-o singură cerere.
 */
export function dinLinkulDeInvitatie(
  d: Partial<DovadaInvitatie>,
): { id: string; invitatLaMs: number } | null {
  const id = (d.u ?? "").trim();
  const clipa = Number(d.i);
  const expira = Number(d.p);
  const semn = (d.s ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!Number.isFinite(clipa) || !Number.isFinite(expira)) return null;
  if (Date.now() > expira) return null;

  /*
    Comparație în timp constant, ca la toate semnăturile din site: una cu
    `===` se oprește la prima literă care diferă, iar din cât durează
    răspunsul se poate ghici semnătura, literă cu literă.
  */
  if (!semnaturaLinkuluiTine(`invitatie:${id}:${clipa}:${expira}`, semn)) {
    return null;
  }

  return { id, invitatLaMs: clipa };
}
