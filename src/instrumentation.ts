/**
 * Rulează o dată, la pornirea serverului.
 *
 * Verifică ce nu se vede altfel decât ca „parolă greșită”: un
 * `SECRET_SESIUNE` sub 32 de semne lasă conturile fără cheie — fundraiserul
 * scrie parola bună și primește „nu se potrivesc”, își schimbă parola, tot
 * așa — iar e-mailurile pleacă fără butoanele de oprire și de card nou.
 * Jurnalul Railway e primul loc în care se uită cineva; acum scrie acolo.
 */
export async function register() {
  const c = (process.env.SECRET_SESIUNE ?? "").trim();
  if (c.length < 32) {
    console.error(
      `[config] SECRET_SESIUNE are ${c.length} semne; sub 32, conturile nu pot intra, iar linkurile din e-mail pleacă fără buton. Se pune în Railway, cel puțin 32 de semne.`,
    );
  }
  if (!(process.env.ADRESA_SITE ?? "").trim()) return;
  if (!/^https?:\/\//i.test(process.env.ADRESA_SITE!.trim())) {
    console.error(`[config] ADRESA_SITE e scris fără https:// („${process.env.ADRESA_SITE}”); se folosește cu schema completată.`);
  }
}
