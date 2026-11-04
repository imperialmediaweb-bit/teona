// Mențiuni pentru auditul „erori”: mai multe servere, fiecare cu o purtare.
//   4432 — merge (Resend /emails, MailerLite, Anthropic, PayPal, Stripe minimal)
//   4433 — răspunde 500 la orice
//   4434 — nu răspunde niciodată (timeout)
//   4435 — răspunde 429 la orice (Anthropic „rate limited”)
//   4436 — nimic nu ascultă (port închis) — nu se pornește aici
//   4437 — răspunde 200 cu HTML (Cloudflare în fața API-ului), nu JSON
// GET /__jurnal pe fiecare arată ce a primit; /__goleste golește.
import http from "node:http";

function porneste(port, purtare) {
  const jurnal = [];
  http.createServer((req, res) => {
    let corp = ""; req.on("data", (c) => (corp += c)); req.on("end", () => {
      const u = req.url;
      if (u === "/__jurnal") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(jurnal)); }
      if (u === "/__goleste") { jurnal.length = 0; res.writeHead(200); return res.end("ok"); }
      let j = {}; try { j = JSON.parse(corp || "{}"); } catch {}
      jurnal.push({ metoda: req.method, cale: u, corp: j, antete: req.headers, lung: corp.length });
      purtare(req, res, u, j);
    });
  }).listen(port, "127.0.0.1", () => console.log(`mențiune pe ${port}`));
}

const da = (res, o, s = 200) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };

porneste(4432, (req, res, u, j) => {
  if (u.startsWith("/emails")) return da(res, { id: "em_" + Date.now() });
  if (u.startsWith("/groups")) return da(res, { data: [{ id: "g-pers", name: "Persoane fizice", active_count: 412 }, { id: "g-firme", name: "Firme", active_count: 57 }] });
  if (u.startsWith("/subscribers")) return da(res, { data: { id: "sub_1", status: "active" } }, 201);
  if (/\/campaigns\/[^/]+\/schedule/.test(u)) return da(res, { data: { status: "sending" } });
  if (u.startsWith("/campaigns")) return da(res, { data: { id: "camp_1" } }, 201);
  if (u.startsWith("/v1/checkout/sessions")) return da(res, { id: "cs_test_audit_" + Date.now(), url: "https://checkout.stripe.com/c/pay/cs_test_audit", object: "checkout.session" });
  if (u.startsWith("/v1/customers")) return da(res, { object: "list", data: [], has_more: false });
  if (u.startsWith("/v1/messages")) return da(res, { id: "msg_1", type: "message", role: "assistant", model: j.model, stop_reason: "end_turn", content: [{ type: "text", text: "Răspuns de probă de la model." }], usage: { input_tokens: 10, output_tokens: 5 } });
  da(res, { eroare: "necunoscut", cale: u }, 404);
});
porneste(4433, (req, res) => da(res, { message: "Internal Server Error (mențiune)" }, 500));
porneste(4434, () => { /* nu răspunde niciodată */ });
porneste(4435, (req, res) => da(res, { type: "error", error: { type: "rate_limit_error", message: "This request would exceed your rate limit (mențiune)" } }, 429));
porneste(4437, (req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end("<html><body>Just a moment... (Cloudflare)</body></html>"); });
