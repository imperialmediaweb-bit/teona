import { createHmac, timingSafeEqual } from "node:crypto";
import { areBazaDeDate, intreaba } from "@/lib/baza";
import { mediu } from "@/lib/mediu";
import { curataHtml } from "@/lib/curata-html";
import { firma as citesteFirma } from "@/lib/crm";
import {
  evenimentTrimis,
  firmaDinAdresa,
  firmaDupaEmail,
  salveazaPrimit,
  type FisierAtasat,
} from "@/lib/mesaje-firme";
import { notificaPanoul } from "@/lib/notificari";
import { curat, trimiteEmail } from "@/lib/email/trimite";
import { paginaInterna } from "@/lib/email/plic";
import { CATRE_ASOCIATIE } from "@/date/asociatie";
import { ADRESA_SITE } from "@/app/seo";

/**
 * Ce anunță Resend: răspunsurile firmelor (`email.received`) și ce s-a
 * întâmplat cu e-mailurile trimise din panou (livrat, deschis, apăsat pe
 * link, respins).
 *
 * Semnătura e cea Svix (antetele `svix-id`, `svix-timestamp`,
 * `svix-signature`), cu secretul din `RESEND_WEBHOOK_SECRET`. Fără secret,
 * ruta refuză tot: altfel oricine ar putea scrie „răspunsuri” în panou.
 */

const API = () => process.env.EMAIL_API?.replace(/\/+$/, "") ?? "https://api.resend.com";
const MAXIM_FISIER = 15 * 1024 * 1024;
const MAXIM_TOTAL = 30 * 1024 * 1024;

function semnaturaTine(corp: string, antete: Headers): boolean {
  const secret = mediu("RESEND_WEBHOOK_SECRET");
  const id = antete.get("svix-id");
  const cand = antete.get("svix-timestamp");
  const semnaturi = antete.get("svix-signature");
  if (!secret || !id || !cand || !semnaturi) return false;
  if (Math.abs(Date.now() / 1000 - Number(cand)) > 5 * 60) return false;
  const cheie = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const asteptat = createHmac("sha256", cheie).update(`${id}.${cand}.${corp}`).digest();
  return semnaturi.split(" ").some((s) => {
    const [, valoare] = s.split(",");
    if (!valoare) return false;
    const primit = Buffer.from(valoare, "base64");
    return primit.length === asteptat.length && timingSafeEqual(primit, asteptat);
  });
}

async function cere<T>(cale: string): Promise<T | null> {
  const cheie = mediu("RESEND_API_KEY");
  if (!cheie) return null;
  const r = await fetch(`${API()}${cale}`, {
    headers: { Authorization: `Bearer ${cheie}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!r?.ok) {
    console.error(`[resend] ${r?.status ?? "rețea"} la ${cale}`);
    return null;
  }
  return (await r.json().catch(() => null)) as T | null;
}

const adresaDin = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase();

type Primit = {
  email_id: string;
  from: string;
  to?: string[];
  received_for?: string[];
  subject?: string;
  attachments?: unknown[];
};

async function raspunsPrimit(d: Primit): Promise<void> {
  const deLa = adresaDin(d.from ?? "");
  const pentru = [...(d.to ?? []), ...(d.received_for ?? [])];
  let firmaId: string | null = null;
  for (const a of pentru) firmaId ??= firmaDinAdresa(a);
  // Adresa poate fi a unei firme șterse între timp: atunci se leagă după expeditor.
  if (firmaId && !(await citesteFirma(firmaId))) firmaId = null;
  firmaId ??= deLa ? await firmaDupaEmail(deLa) : null;

  const plin = await cere<{ html?: string | null; text?: string | null; subject?: string }>(
    `/emails/receiving/${encodeURIComponent(d.email_id)}`,
  );
  const lista = await cere<{
    data?: Array<{ filename?: string; content_type?: string; size?: number; download_url?: string }>;
  }>(`/emails/receiving/${encodeURIComponent(d.email_id)}/attachments?limit=100`);
  /*
    Fără conținut nu se salvează nimic: rândul gol ar ține locul răspunsului
    (cheia e `resend_id`), iar reîncercarea lui Resend ar fi sărită. Aruncat,
    ruta răspunde 500 și Resend mai trimite anunțul.
  */
  if (!plin) throw new Error("conținutul răspunsului n-a venit de la Resend");
  if (!lista && (d.attachments?.length ?? 0) > 0) throw new Error("lista de atașamente n-a venit de la Resend");

  const atasamente: FisierAtasat[] = [];
  let total = 0;
  for (const a of lista?.data ?? []) {
    if (!a.download_url || (a.size ?? 0) > MAXIM_FISIER || total + (a.size ?? 0) > MAXIM_TOTAL) continue;
    const r = await fetch(a.download_url, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
    if (!r?.ok) continue;
    const continut = new Uint8Array(await r.arrayBuffer());
    if (continut.byteLength > MAXIM_FISIER) continue;
    total += continut.byteLength;
    atasamente.push({
      nume: (a.filename || "fisier").replace(/[\\/\r\n"]/g, "_").slice(0, 150),
      tip: a.content_type || "application/octet-stream",
      continut,
    });
  }

  const textPlin = (plin?.text ?? "").trim();
  const corpHtml = (plin?.html ?? "").replace(/^[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*$/i, "");
  const html = corpHtml.trim()
    ? curataHtml(corpHtml)
    : textPlin
        .split(/\n{2,}/)
        .map((p) => `<p>${curat(p).replace(/\n/g, "<br />")}</p>`)
        .join("");
  const subiect = (plin?.subject ?? d.subject ?? "(fără subiect)").slice(0, 300);

  const id = await salveazaPrimit({
    resendId: d.email_id,
    firmaId,
    deLa: (d.from ?? "").slice(0, 300),
    catre: pentru[0] ?? "",
    subiect,
    html,
    text: textPlin.slice(0, 100_000),
    atasamente,
  });
  if (!id) return; // același anunț, a doua oară

  const fi = firmaId ? await citesteFirma(firmaId) : null;
  /*
    Un răspuns nelegat poate fi și spam trimis la întâmplare pe domeniul de
    răspunsuri: se păstrează oricum, dar anunțurile pentru ele sunt cel mult
    trei pe oră, ca un val de spam să nu sune telefoanele toată noaptea.
  */
  if (!fi && !locDeAnuntNelegat()) return;
  const cine = fi?.denumire ?? deLa;
  const unde = fi ? `/admin/firme/${fi.id}/mesaje` : "/admin/firme/mesaje";
  await notificaPanoul({ titlu: `Răspuns de la ${cine}`, text: subiect, adresa: unde }).catch(() => 0);
  /*
    Răspunsul nu mai ajunge într-o căsuță obișnuită (vine pe adresa firmei,
    la Resend), deci asociația îl primește și pe e-mail, cu textul lui și un
    link spre discuție — altfel l-ar vedea numai cine deschide panoul.
  */
  const corp = `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;color:#232323;"><strong>${curat(cine)}</strong> a răspuns: „${curat(subiect)}”${atasamente.length ? ` · ${atasamente.length} atașament${atasamente.length > 1 ? "e" : ""}` : ""}</p>
<div style="margin:0 0 16px;padding:12px 14px;border-left:3px solid #b82b09;background:#f9f5f2;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#3a3a3a;">${curat(textPlin.slice(0, 2000)).replace(/\n/g, "<br />")}</div>
<p style="margin:0;font-family:Arial,sans-serif;font-size:15px;"><a href="${ADRESA_SITE}${unde}" style="color:#b82b09;font-weight:bold;">Deschide discuția în panou</a></p>`;
  await trimiteEmail({
    catre: CATRE_ASOCIATIE,
    subiect: `Răspuns de la ${cine}: ${subiect}`.slice(0, 200),
    html: paginaInterna(`Răspuns de la ${cine}`, corp, subiect),
    text: `${cine} a răspuns: ${subiect}\n\n${textPlin.slice(0, 2000)}\n\n${ADRESA_SITE}${unde}`,
  }).catch(() => false);
}

const anunturiNelegate: number[] = [];
function locDeAnuntNelegat(): boolean {
  const acum = Date.now();
  while (anunturiNelegate.length && acum - anunturiNelegate[0] > 60 * 60 * 1000) anunturiNelegate.shift();
  if (anunturiNelegate.length >= 3) return false;
  anunturiNelegate.push(acum);
  return true;
}

export async function POST(cerere: Request) {
  const corp = await cerere.text();
  if (!mediu("RESEND_WEBHOOK_SECRET")) return new Response("Neconfigurat.", { status: 503 });
  if (!semnaturaTine(corp, cerere.headers)) return new Response("Semnătură greșită.", { status: 401 });
  if (!areBazaDeDate()) return new Response("Fără bază de date.", { status: 503 });

  let ev: { type?: string; data?: Record<string, unknown> };
  try {
    ev = JSON.parse(corp);
  } catch {
    return new Response("JSON stricat.", { status: 400 });
  }
  const d = ev.data ?? {};
  const emailId = typeof d.email_id === "string" ? d.email_id : "";
  if (!emailId) return new Response("ok");

  /*
    Resend retrimite același anunț (același `svix-id`) când nu primește 200 la
    timp. Fără semnul ăsta, o deschidere s-ar număra de două ori. Semnul se
    șterge dacă prelucrarea cade, ca reîncercarea să meargă.
  */
  const svixId = cerere.headers.get("svix-id") ?? "";
  const nou = await intreaba<{ id: string }>(
    "INSERT INTO anunturi_resend (id) VALUES ($1) ON CONFLICT (id) DO NOTHING RETURNING id",
    [svixId],
  );
  if (!nou.length) return new Response("ok");

  try {
    switch (ev.type) {
      case "email.received":
        await raspunsPrimit(d as unknown as Primit);
        break;
      case "email.delivered":
        await evenimentTrimis(emailId, "livrat");
        break;
      case "email.opened":
        await evenimentTrimis(emailId, "deschis");
        break;
      case "email.clicked": {
        const link = (d.click as { link?: string } | undefined)?.link;
        await evenimentTrimis(emailId, "clic", link);
        break;
      }
      case "email.bounced": {
        const b = d.bounce as { message?: string; type?: string } | undefined;
        await evenimentTrimis(emailId, "respins", [b?.type, b?.message].filter(Boolean).join(": ") || "respins");
        break;
      }
      case "email.complained":
        await evenimentTrimis(emailId, "respins", "marcat ca spam de destinatar");
        break;
    }
  } catch (e) {
    // 500, ca Resend să mai încerce: un răspuns pierdut nu se mai găsește.
    console.error(`[resend webhook] ${ev.type}: ${(e as Error).message}`);
    await intreaba("DELETE FROM anunturi_resend WHERE id = $1", [svixId]).catch(() => undefined);
    return new Response("Eroare.", { status: 500 });
  }
  return new Response("ok");
}
