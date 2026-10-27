// Un singur server de mențiune pentru tot ce iese din site: Resend (/emails),
// MailerLite (/groups, /campaigns, /campaigns/:id/schedule), Anthropic (/v1/messages).
// Ține minte ce a primit, la GET /__jurnal.
import http from "node:http";
const jurnal = [];
http.createServer((req, res) => {
  let corp = ""; req.on("data", (c) => (corp += c)); req.on("end", () => {
    const u = req.url;
    if (u === "/__jurnal") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(jurnal)); }
    if (u === "/__goleste") { jurnal.length = 0; res.writeHead(200); return res.end("ok"); }
    let j = {}; try { j = JSON.parse(corp || "{}"); } catch {}
    jurnal.push({ metoda: req.method, cale: u, corp: j });
    const da = (o, s = 200) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (u.startsWith("/emails")) return da({ id: "em_" + jurnal.length });
    if (u.startsWith("/groups")) return da({ data: [{ id: "g-pers", name: "Persoane fizice", active_count: 412 }, { id: "g-firme", name: "Firme", active_count: 57 }] });
    if (/\/campaigns\/[^/]+\/schedule/.test(u)) return da({ data: { status: "sending" } });
    if (u.startsWith("/campaigns")) return da({ data: { id: "camp_" + jurnal.length } }, 201);
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
    if (u.startsWith("/v1/messages")) return da({ id: "msg_1", type: "message", role: "assistant", model: j.model, stop_reason: "end_turn", content: [{ type: "text", text: "Răspuns de probă de la model." }], usage: { input_tokens: 10, output_tokens: 5 } });
    da({ eroare: "necunoscut", cale: u }, 404);
  });
}).listen(4390, "127.0.0.1", () => console.log("mențiune pe 4390"));
