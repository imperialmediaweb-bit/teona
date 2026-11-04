// Mențiune pentru auditul zonei `proxy` (4 noiembrie 2026): joacă Resend
// (/emails), MailerLite, Anthropic, Stripe (/v1/checkout/sessions) și PayPal
// (/v1/oauth2/token, /v2/checkout/orders, verify-webhook-signature).
// Ține minte ce a primit, la GET /__jurnal; /__goleste golește.
// /__stripe-lent?ms=N face ca Stripe să răspundă după N ms (pentru
// `verificaInainte`); /__stripe-lent?ms=0 îl readuce la normal.
// /__sesiune?id=…&email=… pune o sesiune Stripe „plătită” de întors.
import http from "node:http";

const PORT = Number(process.env.PORT_MENTIUNE ?? 4422);
const jurnal = [];
let stripeLentMs = 0;
const sesiuniStripe = new Map();
const comenziPayPal = new Map();

http
  .createServer((req, res) => {
    let corp = "";
    req.on("data", (c) => (corp += c));
    req.on("end", () => {
      const u = req.url ?? "";
      const url = new URL(u, "http://x");
      const da = (o, s = 200) => {
        res.writeHead(s, { "content-type": "application/json" });
        res.end(JSON.stringify(o));
      };
      if (url.pathname === "/__jurnal") return da(jurnal);
      if (url.pathname === "/__goleste") {
        jurnal.length = 0;
        return da({ ok: true });
      }
      if (url.pathname === "/__stripe-lent") {
        stripeLentMs = Number(url.searchParams.get("ms") ?? 0);
        return da({ stripeLentMs });
      }
      if (url.pathname === "/__sesiune") {
        const id = url.searchParams.get("id");
        const email = url.searchParams.get("email");
        sesiuniStripe.set(id, {
          id,
          object: "checkout.session",
          payment_status: url.searchParams.get("plata") ?? "paid",
          status: url.searchParams.get("status") ?? "complete",
          mode: "payment",
          amount_total: 5000,
          currency: "ron",
          customer_email: email,
          customer_details: { email },
          metadata: { destinatie: "tabere", prenume: "Audit", nume: "Proxy", acord_buletin: "nu" },
        });
        return da({ ok: true });
      }
      if (url.pathname === "/__comanda") {
        const id = url.searchParams.get("id");
        comenziPayPal.set(id, {
          captura: url.searchParams.get("captura") ?? `CAP${id}`,
          email: url.searchParams.get("email") ?? "paypal@exemplu.ro",
          incasata: false,
          capturi: 0,
        });
        return da({ ok: true });
      }
      if (url.pathname === "/__comenzi") {
        return da(Object.fromEntries(comenziPayPal));
      }

      let j = {};
      try {
        j = JSON.parse(corp || "{}");
      } catch {}
      jurnal.push({ metoda: req.method, cale: u, corp: j, brut: corp.slice(0, 4000), antete: req.headers });

      if (u.startsWith("/emails")) return da({ id: "em_" + jurnal.length });
      if (u.startsWith("/groups"))
        return da({
          data: [
            { id: "g-pers", name: "Persoane fizice", active_count: 412 },
            { id: "g-firme", name: "Firme", active_count: 57 },
          ],
        });
      if (u.startsWith("/subscribers")) return da({ data: { id: "sub_" + jurnal.length } }, 201);
      if (/\/campaigns\/[^/]+\/schedule/.test(u)) return da({ data: { status: "sending" } });
      if (u.startsWith("/campaigns")) return da({ data: { id: "camp_" + jurnal.length } }, 201);

      // Stripe
      const s = u.match(/^\/v1\/checkout\/sessions\/([^/?]+)/);
      if (s) {
        const raspunde = () => {
          const ses = sesiuniStripe.get(s[1]);
          return ses ? da(ses) : da({ error: { message: "No such checkout.session: " + s[1], type: "invalid_request_error" } }, 404);
        };
        if (stripeLentMs > 0) return setTimeout(raspunde, stripeLentMs);
        return raspunde();
      }
      if (u.startsWith("/v1/checkout/sessions") && req.method === "POST") {
        const id = "cs_test_audit" + jurnal.length;
        const p = new URLSearchParams(corp);
        sesiuniStripe.set(id, {
          id,
          object: "checkout.session",
          payment_status: "unpaid",
          status: "open",
          url: "https://checkout.stripe.com/c/pay/" + id,
          success_url: p.get("success_url"),
          cancel_url: p.get("cancel_url"),
        });
        return da({ id, url: "https://checkout.stripe.com/c/pay/" + id, success_url: p.get("success_url"), cancel_url: p.get("cancel_url") });
      }

      // PayPal
      if (u.startsWith("/v1/oauth2/token")) return da({ access_token: "jeton-proba", expires_in: 3600 });
      if (u.startsWith("/v1/notifications/verify-webhook-signature")) return da({ verification_status: "SUCCESS" });
      if (u === "/v2/checkout/orders" && req.method === "POST") {
        const id = "AUDIT" + String(jurnal.length).padStart(4, "0");
        comenziPayPal.set(id, { captura: "CAP" + id, email: "paypal@exemplu.ro", incasata: false, capturi: 0, corp: j });
        return da({ id, links: [{ rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=" + id }] }, 201);
      }
      const p = u.match(/^\/v2\/checkout\/orders\/([A-Z0-9]+)(\/capture)?/);
      if (p) {
        const comanda = comenziPayPal.get(p[1]);
        if (!comanda) return da({ name: "RESOURCE_NOT_FOUND" }, 404);
        if (p[2]) {
          comanda.capturi++;
          if (comanda.incasata) return da({ name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ORDER_ALREADY_CAPTURED" }] }, 422);
          comanda.incasata = true;
        }
        return da(
          {
            id: p[1],
            status: "COMPLETED",
            payer: { email_address: comanda.email },
            purchase_units: [
              {
                custom_id: "tabere|",
                payments: {
                  captures: [{ id: comanda.captura, status: "COMPLETED", custom_id: "tabere|", amount: { value: "20.00", currency_code: "EUR" } }],
                },
              },
            ],
          },
          p[2] ? 201 : 200,
        );
      }

      // Anthropic
      if (u.startsWith("/v1/messages") && j.stream) {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
        const ev = (t, d) => res.write(`event: ${t}\ndata: ${JSON.stringify({ type: t, ...d })}\n\n`);
        ev("message_start", { message: { id: "msg_s", type: "message", role: "assistant", model: j.model, content: [], stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } });
        ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
        ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: "Răspuns de probă de la model." } });
        ev("content_block_stop", { index: 0 });
        ev("message_delta", { delta: { stop_reason: "end_turn" }, usage: { output_tokens: 5 } });
        ev("message_stop", {});
        return res.end();
      }
      if (u.startsWith("/v1/messages"))
        return da({ id: "msg_1", type: "message", role: "assistant", model: j.model, stop_reason: "end_turn", content: [{ type: "text", text: "Răspuns de probă de la model." }], usage: { input_tokens: 10, output_tokens: 5 } });

      da({ eroare: "necunoscut", cale: u }, 404);
    });
  })
  .listen(PORT, "127.0.0.1", () => console.log("mențiune pe " + PORT));
