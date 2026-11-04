// Deschide fiecare exemplu de la /admin/emailuri (HTML și text) și caută urme de șablon stricat.
const BAZA = process.env.BAZA ?? "http://127.0.0.1:4431";
const PAROLA = process.env.PAROLA_ADMIN ?? "proba-locala-12345";
const r = await fetch(`${BAZA}/api/admin/intrare`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ parola: PAROLA }) });
const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
const pag = await (await fetch(`${BAZA}/admin/emailuri`, { headers: { cookie } })).text();
const linkuri = [...new Set([...pag.matchAll(/href="(\/api\/admin\/email\?[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")))];
console.log(`${linkuri.length} linkuri pe /admin/emailuri`);
const SEMNE = [/undefined/, /\bNaN\b/, /\$\{/, /\[object /, /null lei/, /Invalid Date/, /localhost/, /\bnull\b/];
let defecte = 0;
for (const l of linkuri) {
  const p = await fetch(`${BAZA}${l}`, { headers: { cookie } });
  const t = await p.text();
  const gasite = SEMNE.filter((s) => s.test(t)).map((s) => { const i = t.search(s); return `${s} → „…${t.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, " ")}…”`; });
  if (p.status !== 200 || gasite.length) { defecte++; console.log(`DEFECT ${p.status} ${l}\n  ${gasite.join("\n  ")}`); }
}
console.log(`defecte: ${defecte}`);
