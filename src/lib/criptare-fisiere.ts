import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { mediu } from "@/lib/mediu";

/**
 * Criptarea fișierelor din R2 (atașamentele firmelor; mâine, orice fișier cu
 * date personale), făcută de site înainte de urcare: AES-256-GCM.
 *
 * R2 criptează și el ce ține pe disc, dar cheia aia e a Cloudflare: cine are
 * cheile de acces la depozit citește fișierele limpede. Criptate aici, în
 * depozit ajung numai octeți fără sens; cheia stă în Railway, nu în Cloudflare.
 *
 * **Cheia** e `CHEIE_FISIERE` (cel puțin 32 de semne). Fără ea, se derivă din
 * `SECRET_SESIUNE` (HKDF, cu eticheta proprie). Rândul ține ce cheie a folosit
 * (`criptat`: „f1” sau „s1”), deci o cheie pusă mai târziu nu strică fișierele
 * vechi. **Cheia nu se schimbă și nu se șterge**: fișierele criptate cu ea nu
 * se mai pot deschide fără ea.
 *
 * Forma pe disc: 1 octet versiune · 12 IV · 16 etichetă GCM · conținutul.
 */

type Cheie = { eticheta: "f1" | "s1"; octeti: Buffer };

function cheiaDin(eticheta: "f1" | "s1"): Buffer | null {
  const sursa = eticheta === "f1" ? mediu("CHEIE_FISIERE") : mediu("SECRET_SESIUNE");
  if (!sursa || sursa.length < 32) return null;
  return Buffer.from(hkdfSync("sha256", sursa, "teona-fisiere", `fisiere-${eticheta}`, 32));
}

/** Cheia cu care se criptează acum: `CHEIE_FISIERE` dacă există, altfel derivata din `SECRET_SESIUNE`. */
function cheiaDeAcum(): Cheie | null {
  const f = cheiaDin("f1");
  if (f) return { eticheta: "f1", octeti: f };
  const s = cheiaDin("s1");
  return s ? { eticheta: "s1", octeti: s } : null;
}

/** Criptează. `null` dacă nu există nicio cheie (atunci nu se urcă nimic necriptat în R2). */
export function cripteaza(date: Uint8Array): { date: Buffer; cheie: "f1" | "s1" } | null {
  const k = cheiaDeAcum();
  if (!k) return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k.octeti, iv);
  const corp = Buffer.concat([c.update(date), c.final()]);
  return { date: Buffer.concat([Buffer.from([1]), iv, c.getAuthTag(), corp]), cheie: k.eticheta };
}

/** Decriptează cu cheia scrisă în rând. Aruncă dacă fișierul a fost schimbat sau cheia lipsește. */
export function decripteaza(date: Uint8Array, eticheta: string): Buffer {
  const k = eticheta === "f1" || eticheta === "s1" ? cheiaDin(eticheta) : null;
  if (!k) throw new Error(`cheia „${eticheta}” lipsește: fișierul nu se poate deschide`);
  const b = Buffer.from(date);
  if (b[0] !== 1) throw new Error("fișier criptat într-o formă necunoscută");
  const d = createDecipheriv("aes-256-gcm", k, b.subarray(1, 13));
  d.setAuthTag(b.subarray(13, 29));
  return Buffer.concat([d.update(b.subarray(29)), d.final()]);
}
