import { ASOCIATIA } from "@/date/asociatie";
import { curat, trimiteEmail } from "./trimite";
import { MIC, P, buton, pagina } from "./plic";
import type { Compus } from "./campanie";

/**
 * Invitația în panou: omul își pune singur parola.
 *
 * **Scris ca un link de intrare, nu ca o veste bună.** Un mesaj care spune
 * „ți-am făcut cont!" și pune un buton arată exact ca o înșelătorie — fiindcă
 * așa arată și cele adevărate. De aceea scrie de la cine vine, cine l-a
 * trimis, cât ține linkul și ce să facă dacă nu se aștepta la el.
 *
 * **Nu scrie ce rol are.** „Ai acces la donații și la Formularele 230" într-un
 * e-mail care poate ajunge greșit spune străinului exact ce a nimerit. Omul
 * vede ce poate face după ce intră.
 */
export function compuneInvitatia(d: {
  nume: string;
  link: string;
  /** Cine a făcut contul. Un nume, nu o adresă. */
  deLa?: string | null;
}): Compus {
  const titlu = `Contul tău în panoul ${ASOCIATIA.denumire}`;
  const prenume = d.nume.trim().split(/\s+/)[0];
  const cine = d.deLa?.trim()
    ? `${curat(d.deLa.trim())} ți-a făcut`
    : "Ți s-a făcut";

  const corp = `
    <p style="${P}">Bună, ${curat(prenume)},</p>
    <p style="${P}">${cine} un cont în panoul asociației. Apasă butonul și îți pui parola — o alegi tu, nu ți-o dă nimeni.</p>
    ${buton("Îmi pun parola", d.link)}
    <p style="${MIC}word-break:break-all;">${curat(d.link)}</p>
    <p style="${MIC}">Linkul merge <strong>o singură dată</strong> și expiră în <strong>șapte zile</strong>. După ce îți pui parola, n-o mai știe nimeni altcineva — nici cel care ți-a făcut contul.</p>
    <p style="${MIC}">Dacă nu te așteptai la mesajul ăsta, nu trebuie să faci nimic: fără link nu intră nimeni în cont. Scrie-ne și îl oprim.</p>`;

  return {
    subiect: titlu,
    html: pagina(
      titlu,
      corp,
      "Îți pui singur parola. Linkul merge o dată și expiră în șapte zile.",
    ),
    text: `Bună, ${prenume},

${d.deLa?.trim() ? `${d.deLa.trim()} ți-a făcut` : "Ți s-a făcut"} un cont în panoul asociației. Deschide linkul ca să-ți pui parola — o alegi tu, nu ți-o dă nimeni:
${d.link}

Linkul merge o singură dată și expiră în șapte zile. După ce îți pui parola, n-o mai știe nimeni altcineva.

Dacă nu te așteptai la mesajul ăsta, nu trebuie să faci nimic: fără link nu intră nimeni în cont.

${ASOCIATIA.denumire}`,
  };
}

/** Trimite invitația. Întoarce `false` dacă n-a plecat. */
export function trimiteInvitatia(d: {
  email: string;
  nume: string;
  link: string;
  deLa?: string | null;
}): Promise<boolean> {
  return trimiteEmail({ catre: d.email, ...compuneInvitatia(d) });
}
