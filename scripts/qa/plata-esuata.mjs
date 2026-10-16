/**
 * Donația lunară care n-a trecut: tot drumul, de la Stripe la lista de sunat.
 *
 * E cea mai tăcută pierdere de bani dintr-un ONG cu donații recurente — un
 * card expiră, plata cade, Stripe mai încearcă de câteva ori și oprește
 * abonamentul, iar donatorul crede că donează în continuare. Proba verifică
 * exact lucrurile de care atârnă recuperarea:
 *
 * 1. **Evenimentul nesemnat nu intră.** Altfel oricine ar putea inventa
 *    „plăți eșuate" pentru oameni care n-au nimic.
 * 2. **Un rând pe factură, nu pe încercare.** Stripe trimite același
 *    eveniment la fiecare reîncercare; patru mesaje despre același card nu
 *    se citesc, al treilea se marchează ca spam.
 * 3. **Rândul se închide singur când plata trece** — altfel lista de
 *    telefoane se umple de oameni care și-au schimbat deja cardul și nu se
 *    mai deschide de nimeni.
 * 4. **Linkul de schimbat cardul nu e o cheie pe viață** și, când portalul
 *    nu răspunde, omul primește un telefon, nu o eroare.
 *
 * Rulare (cere bază de date):
 *   PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/plata-esuata.mjs
 */

import { createHmac } from "node:crypto";
import { spawn } from "node:child_process";

const PAROLA = process.env.PAROLA_ADMIN;
if (!PAROLA) {
  console.error("Lipsește PAROLA_ADMIN din mediu.");
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error("Lipsește DATABASE_URL.");
  process.exit(2);
}

let rele = 0;
function verifica(ok, mesaj) {
  console.log(`${ok ? "ok  " : "CADE"} ${mesaj}`);
  if (!ok) rele++;
}

const PORT = 4352;
const BAZA = `http://127.0.0.1:${PORT}`;
const SECRET_WEBHOOK = "whsec_de_proba_pentru_verificari";
const SECRET_SESIUNE = "secret-de-proba-pentru-verificari-1234";
const DE_LA = `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
const FACTURA = `in_proba_${Date.now()}`;
const ABONAMENT = `sub_proba${Date.now()}`;

function semneaza(corp) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", SECRET_WEBHOOK)
    .update(`${t}.${corp}`)
    .digest("hex");
  return `t=${t},v1=${v1}`;
}

function factura(idEveniment, tip) {
  return JSON.stringify({
    id: idEveniment,
    object: "event",
    type: tip,
    data: {
      object: {
        id: FACTURA,
        object: "invoice",
        customer: "cus_probadonator",
        customer_email: "maria.proba@exemplu.ro",
        currency: "ron",
        amount_due: 15000,
        amount_paid: tip === "invoice.paid" ? 15000 : 0,
        billing_reason: "subscription_cycle",
        parent: {
          subscription_details: {
            subscription: ABONAMENT,
            metadata: {
              prenume: "Maria",
              destinatie: "tabere",
              frecventa: "lunar",
              canal: "email",
            },
          },
        },
        lines: { data: [{ amount: 15000 }] },
        last_finalization_error: { message: "Your card has expired." },
      },
    },
  });
}

async function trimiteEveniment(corp, semnatura) {
  return fetch(`${BAZA}/api/donatii/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": DE_LA,
      ...(semnatura ? { "stripe-signature": semnatura } : {}),
    },
    body: corp,
  });
}

const site = spawn("npm", ["run", "start"], {
  detached: true,
  env: {
    ...process.env,
    PORT: String(PORT),
    STRIPE_SECRET_KEY: "sk_test_de_proba",
    STRIPE_WEBHOOK_SECRET: SECRET_WEBHOOK,
    SECRET_SESIUNE,
  },
  stdio: "ignore",
});

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

  // ─── 1. Fără semnătură, nimic ──────────────────────────────────────────
  const corp1 = factura("evt_proba_1", "invoice.payment_failed");
  const nesemnat = await trimiteEveniment(corp1, null);
  verifica(nesemnat.status === 400, "un eveniment nesemnat e refuzat (400)");

  const semnatStramb = await trimiteEveniment(corp1, "t=1,v1=aiurea");
  verifica(
    semnatStramb.status === 400,
    "o semnătură inventată e refuzată (400)",
  );

  // ─── 2. Eșecul intră o dată ────────────────────────────────────────────
  const primul = await trimiteEveniment(corp1, semneaza(corp1));
  verifica(primul.status === 200, "eșecul semnat e primit (200)");

  // Aceeași factură, alt eveniment: Stripe reîncearcă.
  const corp2 = factura("evt_proba_2", "invoice.payment_failed");
  const alDoilea = await trimiteEveniment(corp2, semneaza(corp2));
  verifica(alDoilea.status === 200, "reîncercarea e primită și ea (200)");

  // ─── 3. În panou ───────────────────────────────────────────────────────
  let cookie = "";
  const intra = await fetch(`${BAZA}/api/admin/intrare`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": DE_LA,
    },
    body: new URLSearchParams({ parola: PAROLA, unde: "/admin/donatii" }),
  });
  for (const c of intra.headers.getSetCookie?.() ?? []) cookie = c.split(";")[0];
  const antet = { cookie, "x-forwarded-for": DE_LA };

  const donatii = await (
    await fetch(`${BAZA}/admin/donatii`, { headers: antet })
  ).text();
  verifica(
    donatii.includes("maria.proba@exemplu.ro"),
    "donatorul apare în lista de sunat",
  );
  verifica(
    donatii.includes("2 încercări"),
    "a doua cădere se numără ca încercare, nu ca rând nou",
  );
  verifica(
    donatii.includes("Your card has expired"),
    "ce a spus banca e scris lângă el",
  );

  const tablou = await (await fetch(`${BAZA}/admin`, { headers: antet })).text();
  verifica(
    tablou.includes("donații lunare care n-au trecut"),
    "apare în „De făcut acum”",
  );

  // ─── 4. Plata trece: rândul se închide ─────────────────────────────────
  const corpPlatit = factura("evt_proba_3", "invoice.paid");
  const platit = await trimiteEveniment(corpPlatit, semneaza(corpPlatit));
  verifica(platit.status === 200, "plata care trece e primită (200)");

  const dupa = await (
    await fetch(`${BAZA}/admin/donatii`, { headers: antet })
  ).text();
  verifica(
    !dupa.includes("maria.proba@exemplu.ro") ||
      !dupa.includes("Donații lunare care n-au trecut"),
    "rândul dispare singur după ce plata a trecut",
  );

  // ─── 5. Linkul de schimbat cardul ──────────────────────────────────────
  const expira = Date.now() + 10 * 60 * 1000;
  const semn = createHmac("sha256", SECRET_SESIUNE)
    .update(`card:cus_probadonator:${expira}`)
    .digest("hex");
  const bun = await fetch(
    `${BAZA}/actualizeaza-cardul?c=cus_probadonator&p=${expira}&s=${semn}`,
    { redirect: "manual", headers: { "x-forwarded-for": DE_LA } },
  );
  /*
    Cu chei de probă, Stripe refuză sesiunea de portal — și exact asta se
    verifică aici: omul primește o pagină cu telefon, nu o eroare albă.
    Cu chei adevărate, răspunsul ar fi o redirecționare către Stripe.
  */
  verifica(
    bun.status === 503 || bun.status === 303,
    `linkul bun duce la portal sau, fără portal, la o pagină cu telefon (${bun.status})`,
  );
  if (bun.status === 503) {
    const pagina = await bun.text();
    verifica(
      pagina.includes("0754") || pagina.includes("contact@teona-ariana.ro"),
      "pagina aia chiar are telefon și adresă",
    );
  }

  const stricat = await fetch(
    `${BAZA}/actualizeaza-cardul?c=cus_probadonator&p=${expira}&s=aiurea`,
    { redirect: "manual", headers: { "x-forwarded-for": DE_LA } },
  );
  verifica(stricat.status === 410, "o semnătură stricată nu deschide nimic");

  const expirat = await fetch(
    `${BAZA}/actualizeaza-cardul?c=cus_probadonator&p=1&s=${semn}`,
    { redirect: "manual", headers: { "x-forwarded-for": DE_LA } },
  );
  verifica(expirat.status === 410, "un link vechi nu mai deschide nimic");

  // ─── 6. Mesajele se văd în panou ───────────────────────────────────────
  const emailuri = await (
    await fetch(`${BAZA}/admin/emailuri`, { headers: antet })
  ).text();
  verifica(
    emailuri.includes("Plata lunară n-a trecut"),
    "mesajul către donator se vede la /admin/emailuri",
  );
} finally {
  try {
    process.kill(-site.pid, "SIGTERM");
  } catch {
    /* se închisese deja */
  }
}

console.log(rele === 0 ? "\ntoate probele trec" : `\nverificări picate: ${rele}`);
process.exit(rele === 0 ? 0 : 1);
