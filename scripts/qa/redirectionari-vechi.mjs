// Verifică fiecare adresă veche de proiect (/portfolio/...) din continut/proiecte.json:
// unde ajunge după redirecționări și dacă pagina finală e una reală sau pagina 404.
import { readFileSync } from "node:fs";
const BAZA = process.env.BAZA ?? "http://localhost:3000";
const proiecte = JSON.parse(readFileSync(new URL("../../continut/proiecte.json", import.meta.url), "utf8"));
let rele = 0;
for (const p of proiecte) {
  const cale = new URL(p.adresa).pathname;
  const r = await fetch(BAZA + cale, { redirect: "follow" });
  const html = await r.text();
  const titlu = (html.match(/<title>([^<]*)<\/title>/) || [])[1] ?? "";
  const e404 = titlu.startsWith("Pagina nu a fost găsită") || !/<h1[^>]*>(?!Pagina nu a fost)/.test(html);
  const ok = r.status === 200 && !e404 && !r.url.endsWith("/proiecte");
  if (!ok) rele++;
  console.log(`${ok ? "OK " : "RĂU"} ${decodeURIComponent(cale)}\n     → ${r.url} [${r.status}${e404 ? ", conținut 404" : ""}] ${titlu.slice(0, 60)}`);
}
console.log(`\n${rele} din ${proiecte.length} adrese vechi de proiect nu ajung la pagina lor.`);
