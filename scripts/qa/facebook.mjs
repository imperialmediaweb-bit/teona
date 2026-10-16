/**
 * Pagina de Facebook: cifrele ei și trimiterea unei noutăți pe ea.
 *
 * Se pornește un server care imită Graph API, i se dă site-ului adresa lui
 * prin `META_API`, și se citește **ce a primit**. Trei lucruri contează:
 *
 * 1. **Nu pleacă nimic fără apăsarea cuiva din panou** — ruta cere sesiune.
 * 2. **Linkul din postare poartă eticheta**, altfel donațiile venite de pe
 *    pagină s-ar amesteca cu restul și n-am ști niciodată dacă postările
 *    aduc ceva.
 * 3. **Nu pleacă de două ori.** Un text publicat de două ori pe pagină arată
 *    ca o greșeală a asociației.
 *
 * Rulare (cere bază de date, cu cel puțin un text publicat):
 *   BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/facebook.mjs
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error("Lipsește DATABASE_URL: proba are nevoie de texte publicate.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
const PORT_API = 4331;
const PORT_SITE = 4332;

const postari = [];
const fals = createServer((cerere, raspuns) => {
  const adresa = new URL(cerere.url, "http://127.0.0.1");
  raspuns.setHeader("content-type", "application/json");

  if (cerere.method === "POST" && adresa.pathname.endsWith("/feed")) {
    let corp = "";
    cerere.on("data", (b) => (corp += b));
    cerere.on("end", () => {
      postari.push(Object.fromEntries(new URLSearchParams(corp)));
      raspuns.end(JSON.stringify({ id: "555_999" }));
    });
    return;
  }

  if (adresa.pathname.endsWith("/insights")) {
    raspuns.end(
      JSON.stringify({
        data: [
          { name: "page_impressions_unique", values: [{ value: 700 }, { value: 300 }] },
          { name: "page_post_engagements", values: [{ value: 40 }] },
        ],
      }),
    );
    return;
  }

  raspuns.end(
    JSON.stringify({
      id: "555",
      name: "Asociația Teona Ariana Suceava",
      link: "https://facebook.com/asociatia.teona.ariana",
      fan_count: 4200,
      followers_count: 4400,
      tasks: ["CREATE_CONTENT", "MANAGE"],
    }),
  );
});
await new Promise((r) => fals.listen(PORT_API, r));

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT_SITE),
    META_API: `http://127.0.0.1:${PORT_API}`,
    META_PAGE_ID: "555",
    META_PAGE_TOKEN: "jeton-de-proba",
  },
  stdio: "ignore",
});

const BAZA = `http://127.0.0.1:${PORT_SITE}`;

try {
  const pornit = Date.now();
  while (Date.now() - pornit < 60000) {
    try {
      const r = await fetch(`${BAZA}/admin`);
      if (r.ok) break;
    } catch {
      /* încă nu ascultă */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  // ─── Fără sesiune, nimic nu pleacă pe pagină ────────────────────────────
  const peFurate = await fetch(`${BAZA}/api/admin/facebook`, {
    method: "POST",
    redirect: "manual",
    headers: { "x-forwarded-for": DE_LA },
    body: new URLSearchParams({ id: "00000000-0000-0000-0000-000000000000" }),
  });
  verifica(peFurate.status === 403, "nu se postează fără sesiune (403)");
  verifica(postari.length === 0, "și nici n-a ajuns ceva la Facebook");

  let cookie = "";
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": DE_LA,
    },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/facebook" }),
  });
  for (const c of intra.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];

  const antet = { cookie, "x-forwarded-for": DE_LA };

  // ─── Cifrele paginii ────────────────────────────────────────────────────
  const pagina = await fetch(`${BAZA}/admin/facebook`, { headers: antet });
  const html = await pagina.text();
  verifica(
    html.includes("Asociația Teona Ariana Suceava"),
    "pagina legată apare cu numele ei",
  );
  verifica(html.includes("4400"), "urmăritorii vin de la Facebook");
  verifica(html.includes("1000"), "vizualizările se adună pe toate zilele");

  // ─── Trimiterea unui text publicat ──────────────────────────────────────
  const idText = (html.match(/name="id" value="([0-9a-f-]{36})"/) ?? [])[1];
  verifica(Boolean(idText), "există cel puțin un text publicat de trimis");

  if (idText) {
    const trimis = await fetch(`${BAZA}/api/admin/facebook`, {
      method: "POST",
      redirect: "manual",
      headers: { ...antet, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id: idText, mesaj: "Text de probă" }),
    });
    verifica(trimis.status === 303, "apăsarea duce înapoi în panou (303)");
    verifica(postari.length === 1, "postarea a ajuns la Facebook o dată");

    const p = postari[0] ?? {};
    verifica(p.message === "Text de probă", "mesajul e cel scris în panou");
    verifica(
      (p.link ?? "").includes("utm_source=facebook") &&
        (p.link ?? "").includes("utm_medium=social"),
      "linkul poartă eticheta, ca donațiile de aici să se vadă separat",
    );

    // A doua apăsare nu mai trimite nimic.
    const dinNou = await fetch(`${BAZA}/api/admin/facebook`, {
      method: "POST",
      redirect: "manual",
      headers: { ...antet, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id: idText, mesaj: "A doua oară" }),
    });
    verifica(
      (dinNou.headers.get("location") ?? "").includes("ratat=deja"),
      "a doua apăsare spune că a plecat deja",
    );
    verifica(postari.length === 1, "și nu trimite a doua postare");
  }
} finally {
  try {
    process.kill(-site.pid, "SIGTERM");
  } catch {
    /* se închisese deja */
  }
  fals.close();
}

console.log(rele === 0 ? "\ntoate probele trec" : `\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
