// Audit „mediu”: un server de mențiune pe două porturi.
//   4442 — Resend (/emails), MailerLite (/groups, /subscribers, /campaigns), Anthropic (/v1/messages)
//   4443 — Stripe (/v1/checkout/sessions/:id, /v1/billing_portal/sessions), PayPal (/v1/oauth2/token, /v2/checkout/orders/:id)
// Ține minte tot ce a primit: GET /__jurnal (JSON), GET /__goleste.
import http from "node:http";

const jurnal = [];
const sesiuniStripe = new Map();
const comenziPayPal = new Map();

function serveste(req, res) {
  const bucati = [];
  req.on("data", (b) => bucati.push(b));
  req.on("end", () => {
    const corp = Buffer.concat(bucati).toString("utf8");
    const u = req.url ?? "";
    const da = (o, s = 200, antete = {}) => {
      res.writeHead(s, { "content-type": "application/json", ...antete });
      res.end(JSON.stringify(o));
    };
    if (u === "/__jurnal") return da(jurnal);
    if (u === "/__goleste") { jurnal.length = 0; return da({ ok: true }); }
    if (u.startsWith("/__stripe/")) { // înregistrează o sesiune de probă
      const s = JSON.parse(corp || "{}"); sesiuniStripe.set(s.id, s); return da({ ok: true });
    }
    if (u.startsWith("/__paypal/")) { const c = JSON.parse(corp || "{}"); comenziPayPal.set(c.id, c); return da({ ok: true }); }

    let j = null;
    try { j = corp ? JSON.parse(corp) : null; } catch { j = { __brut: corp.slice(0, 2000) }; }
    jurnal.push({ port: req.socket.localPort, metoda: req.method, cale: u, antete: req.headers, corp: j, brut: j && j.__brut ? undefined : corp.slice(0, 200000) });

    // Resend
    if (u.startsWith("/emails")) return da({ id: `em_${jurnal.length}` });
    // MailerLite
    if (u.startsWith("/groups")) return da({ data: [{ id: "g-pers", name: "Persoane fizice", active_count: 412 }, { id: "g-firme", name: "Firme", active_count: 57 }] });
    if (/^\/subscribers\/[^/]+$/.test(u) && req.method === "GET") return da({ message: "Resource not found" }, 404);
    if (u.startsWith("/subscribers")) return da({ data: { id: `sub_${jurnal.length}`, status: "active" } }, 201);
    if (/\/campaigns\/[^/]+\/schedule/.test(u)) return da({ data: { status: "sending" } });
    if (u.startsWith("/campaigns")) return da({ data: { id: `camp_${jurnal.length}` } }, 201);
    // Anthropic
    if (u.startsWith("/v1/messages") && j && j.stream) {
      res.writeHead(200, { "content-type": "text/event-stream" });
      const ev = (t, d) => res.write(`event: ${t}\ndata: ${JSON.stringify({ type: t, ...d })}\n\n`);
      ev("message_start", { message: { id: "msg_s", type: "message", role: "assistant", model: j.model, content: [], stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } });
      ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
      ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: "Răspuns de probă." } });
      ev("content_block_stop", { index: 0 });
      ev("message_delta", { delta: { stop_reason: "end_turn" }, usage: { output_tokens: 5 } });
      ev("message_stop", {});
      return res.end();
    }
    if (u.startsWith("/v1/messages")) return da({ id: "msg_1", type: "message", role: "assistant", model: j?.model, stop_reason: "end_turn", content: [{ type: "text", text: "Răspuns de probă." }], usage: { input_tokens: 10, output_tokens: 5 } });
    // Stripe
    if (u.startsWith("/v1/checkout/sessions") && req.method === "POST") return da({ id: `cs_mock_${jurnal.length}`, object: "checkout.session", url: "https://checkout.stripe.com/c/pay/mock" });
    const s = u.match(/^\/v1\/checkout\/sessions\/([^/?]+)/);
    if (s) { const ses = sesiuniStripe.get(s[1]); return ses ? da(ses) : da({ error: { message: "No such session" } }, 404); }
    if (u.startsWith("/v1/billing_portal/sessions")) return da({ id: "bps_1", url: "https://billing.stripe.com/p/session/proba" });
    if (u.startsWith("/v1/customers")) return da({ data: [], has_more: false });
    if (u.startsWith("/v1/subscriptions/")) return da({ id: u.split("/")[3].split("?")[0], status: "canceled" });
    if (u.startsWith("/v1/subscriptions")) return da({ data: [], has_more: false });
    // PayPal
    if (u.startsWith("/v1/oauth2/token")) return da({ access_token: "jeton-proba", expires_in: 3600 });
    if (u.startsWith("/v1/notifications/verify-webhook-signature")) return da({ verification_status: "SUCCESS" });
    const p = u.match(/^\/v2\/checkout\/orders\/([A-Z0-9]+)(\/capture)?/);
    if (p) {
      const c = comenziPayPal.get(p[1]);
      if (!c) return da({ name: "RESOURCE_NOT_FOUND" }, 404);
      if (p[2]) c.incasata = true;
      return da({ id: p[1], status: "COMPLETED", payer: { email_address: c.email }, purchase_units: [{ payments: { captures: [{ id: c.captura, status: "COMPLETED", custom_id: "tabere|", amount: { value: "20.00", currency_code: "EUR" } }] } }] }, p[2] ? 201 : 200);
    }
    da({ eroare: "necunoscut", cale: u }, 404);
  });
}

// 4444 — R2 (orice GET cu Range răspunde 206; se vede gazda și calea cerută)
http.createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    jurnal.push({ port: 4444, metoda: req.method, cale: req.url, antete: req.headers, corp: null });
    if (req.method === "GET" || req.method === "HEAD") { res.writeHead(206, { "content-type": "application/pdf", "content-range": "bytes 0-0/1000" }); return res.end("%"); }
    res.writeHead(200); res.end("");
  });
}).listen(4444, "127.0.0.1", () => console.log("mențiune 4444 (R2)"));
http.createServer(serveste).listen(4442, "127.0.0.1", () => console.log("mențiune 4442"));
http.createServer(serveste).listen(4443, "127.0.0.1", () => console.log("mențiune 4443"));
