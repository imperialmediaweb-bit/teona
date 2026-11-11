import webpush from "web-push";
import { esteProba } from "./proba";
import { mediu } from "@/lib/mediu";
import { areBazaDeDate, intreaba } from "./baza";

/**
 * Notificările pe telefon ale panoului: o donație nouă, un transfer anunțat.
 *
 * Merg numai în aplicația panoului instalată (PWA) sau în browserul în care
 * cineva a apăsat „Primește notificări”. Pe iPhone, numai din aplicația
 * instalată pe ecranul principal (iOS 16.4 sau mai nou): Safari deschis
 * obișnuit nu le primește.
 *
 * Cheile VAPID stau în Railway (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
 * Fără ele nu pleacă nimic, iar panoul spune asta în loc să arate un buton
 * care nu face nimic. **Textul notificării nu poartă date personale** dincolo
 * de un prenume și o sumă: apare pe ecranul blocat, unde îl vede oricine e
 * lângă telefon.
 */

export function cheiaPublica(): string | null {
  return mediu("VAPID_PUBLIC_KEY") ?? null;
}

export function areNotificari(): boolean {
  return Boolean(mediu("VAPID_PUBLIC_KEY") && mediu("VAPID_PRIVATE_KEY"));
}

let pregatit = false;
function pregateste(): boolean {
  if (!areNotificari()) return false;
  if (!pregatit) {
    webpush.setVapidDetails(
      "mailto:contact@teona-ariana.ro",
      mediu("VAPID_PUBLIC_KEY")!,
      mediu("VAPID_PRIVATE_KEY")!,
    );
    pregatit = true;
  }
  return true;
}

export type AbonamentBrowser = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function abonamentValid(x: unknown): x is AbonamentBrowser {
  const a = x as AbonamentBrowser;
  return (
    typeof a?.endpoint === "string" &&
    /^https:\/\/[^\s]{10,800}$/.test(a.endpoint) &&
    typeof a.keys?.p256dh === "string" &&
    a.keys.p256dh.length < 200 &&
    typeof a.keys?.auth === "string" &&
    a.keys.auth.length < 100
  );
}

export async function salveazaAbonament(
  a: AbonamentBrowser,
  utilizatorId: string | null,
): Promise<void> {
  await intreaba(
    `INSERT INTO abonamente_push (endpoint, p256dh, auth, utilizator_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
       SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
           utilizator_id = EXCLUDED.utilizator_id`,
    [a.endpoint, a.keys.p256dh, a.keys.auth, utilizatorId],
  );
}

export async function stergeAbonament(endpoint: string): Promise<void> {
  await intreaba("DELETE FROM abonamente_push WHERE endpoint = $1", [endpoint]);
}

/**
 * Trimite notificarea la toate telefoanele abonate.
 *
 * Nu aruncă niciodată: o notificare care nu pleacă nu are voie să oprească o
 * donație din a fi înregistrată. Abonamentele moarte (browser dezinstalat,
 * permisiune retrasă: 404 sau 410) se șterg pe loc. Cele ale conturilor oprite
 * nu mai primesc nimic — un om oprit nu află nici de donațiile de mâine.
 */
export async function notificaPanoul(n: {
  titlu: string;
  text: string;
  adresa: string;
}): Promise<number> {
  if (!pregateste() || !areBazaDeDate()) return 0;
  // O probă automată nu sună telefoanele asociației (vezi `lib/proba.ts`).
  if (await esteProba()) return 0;
  const randuri = await intreaba<{ endpoint: string; p256dh: string; auth: string }>(
    `SELECT a.endpoint, a.p256dh, a.auth
       FROM abonamente_push a
       LEFT JOIN utilizatori u ON u.id = a.utilizator_id
      WHERE u.activ = true`,
  ).catch(() => []);
  const corp = JSON.stringify(n);
  let trimise = 0;
  await Promise.all(
    randuri.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          corp,
          { TTL: 24 * 3600, urgency: "high" },
        );
        trimise++;
      } catch (e) {
        const cod = (e as { statusCode?: number }).statusCode;
        if (cod === 404 || cod === 410) {
          await stergeAbonament(r.endpoint).catch(() => undefined);
        }
      }
    }),
  );
  return trimise;
}
