/**
 * Service worker-ul panoului, servit din `/admin/sw.js`, deci cu raza
 * `/admin/` — nu atinge site-ul public.
 *
 * **Nu păstrează nimic.** Panoul are nume, telefoane, CNP-uri din Formularele
 * 230: o copie în memoria telefonului ar rămâne acolo și după ce contul e
 * oprit sau telefonul pierdut. Lucrătorul există numai ca aplicația să se
 * poată instala și ca, fără internet, să apară o pagină care spune asta, în
 * loc de dinozaurul browserului.
 */

const COD = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  // Numai deschiderile de pagină. Formularele (POST) trec pe lângă lucrător,
  // direct la server, cu redirecționarea lor cu tot.
  if (e.request.mode !== "navigate" || e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fără internet</title><body style="margin:0;font-family:system-ui,sans-serif;background:#f4f5f7;color:#232323;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px"><div><h1 style="font-size:22px">Nu ești conectat la internet</h1><p style="color:#616161">Panoul are nevoie de internet. Când revine conexiunea, apasă mai jos.</p><button onclick="location.reload()" style="margin-top:12px;border:0;border-radius:999px;background:#c2410c;color:#fff;font-weight:700;padding:12px 22px">Încearcă din nou</button></div></body></html>',
          { headers: { "content-type": "text/html; charset=utf-8" } },
        ),
    ),
  );
});
`;

export function GET() {
  return new Response(COD, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
