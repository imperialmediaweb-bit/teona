# Audit de securitate — site-ul nou teona-ariana.ro

Data: 8 octombrie 2026 · Depozit: `imperialmediaweb-bit/teona`, ramura `main` la `70c6983` ·
Stiva: Next.js 16.4, React 19.3, Railway.

## Rezumat pentru client

1. **Depozitul de cod de pe GitHub este public** și conține numele complete, diagnosticele și situația familială ale unor copii ajutați de asociație, plus toate cele 321 de fotografii. Site-ul nou nu afișează aceste texte, dar oricine de pe internet le poate citi din depozit. Trebuie făcut privat **azi**, de către proprietarul contului GitHub — e o setare, durează un minut.
2. Serverul nu trimitea niciun antet de securitate: pagina putea fi pusă într-un cadru pe alt site, iar browserul nu avea nicio regulă despre ce scripturi are voie să încarce. **Reparat**: șapte antete, verificate în browser; formularul 230 și bannerul de cookie-uri funcționează ca înainte.
3. Formularele de contact, voluntariat și newsletter puteau fi trimise de oricâte ori și cu orice dimensiune (am trimis 5 MB și serverul i-a citit). **Reparat**: limită de 16 KB, cel mult 6 trimiteri la 10 minute de la aceeași adresă, verificarea vârstei de 18 ani și pe server, capcană pentru roboți.
4. Nu există chei sau parole în cod ori în istoricul depozitului; exportul din WordPress a fost curățat corect (zero comentarii, zero donații, zero conturi, în toate versiunile); fotografiile nu conțin coordonate GPS; nimic extern nu se încarcă înainte de acordul pentru cookie-uri; fonturile vin de pe domeniul nostru.
5. Dependențele de producție nu au vulnerabilități cunoscute. Cele 5 avertismente „high” din `npm audit` sunt toate aceeași bibliotecă (`braces`), folosită doar de ESLint la dezvoltare, nu pe site, și nu are versiune reparată.

## Tabel

| # | Problemă | Gravitate | Stare |
|---|---|---|---|
| 1 | Depozit GitHub public, cu date de sănătate ale unor copii și cu fotografiile lor | **critic** | **de făcut de proprietarul GitHub** |
| 2 | Niciun antet de securitate (CSP, HSTS, X-Frame-Options, …); `X-Powered-By` dezvăluia stiva | important | reparat în `next.config.ts` |
| 3 | Rutele API: fără limită de dimensiune a corpului, fără limită de rată, fără verificarea tipului de conținut, vârsta voluntarului verificată doar în browser | important | reparat în `src/lib/api.ts` + rute |
| 4 | Capcana pentru roboți există pe server, dar formularele nu trimit încă acel câmp | minor | de făcut de agentul de componente |
| 5 | CSP cu `'unsafe-inline'` la scripturi și stiluri | minor, asumat | explicat mai jos; alternativa cere o decizie |
| 6 | `npm audit`: 5 × high, toate `braces` prin `eslint-config-next` (doar dezvoltare) | minor | fără versiune reparată; nu afectează site-ul |
| 7 | `continut/continut.json` (2,6 MB) nu e documentat în CLAUDE.md și conține și paginile-șablon ale temei, formulare GiveWP la coș și textele cazurilor umanitare | minor | de decis dacă rămâne |
| 8 | HSTS fără `preload`; limitarea de rată e în memoria procesului | minor, asumat | pași după lansare |

Ce e în regulă e listat la sfârșit, pe scurt.

---

## 1. Depozitul public și datele copiilor — CRITIC

**Ce e.** `gh api repos/imperialmediaweb-bit/teona` răspunde `"private": false, "visibility": "public"`.
Depozitul conține, în clar:

- **Nume complete de copii, diagnostice și situație familială**, de exemplu:
  - `continut/proiecte.json:70` — o fetiță de 9 ani, prenume, localitate, diagnostic chirurgical, faptul că e în plasament maternal și **numele asistentei maternale**;
  - `continut/proiecte.json:670` — un copil cu malformație cardiacă, numele familiei de plasament și localitatea;
  - `continut/articole.json:112` — nume și prenume complet al unui copil, cu lista diagnosticelor (retard psihomotor, parapareză spastică etc.);
  - `continut/articole.json:94` — numele complet al unei fetițe de 9 ani;
  - aceleași texte și în `continut/continut.json:37932, 38538, 38649, 41726` și în `scripts/export-wordpress.xml:37448, 44366, 45498, 47739`.
- **321 de fotografii** cu copii cu dizabilități, în `public/poze/`, descărcabile dintr-un singur `git clone`.
- Adresele de email ale membrilor echipei (`paula@`, `eudochia@`, `daniel@teona-ariana.ro`, `ata.suceava@gmail.com`) — erau publice pe site-ul vechi, nu e o scurgere, dar sunt în același pachet.

**Ce se poate întâmpla concret.** Datele de sănătate ale minorilor și statutul de plasament sunt categorii speciale (art. 9 GDPR, plus legislația de protecția copilului). Textele erau publicate și pe site-ul vechi, dar acolo asociația le putea scoate oricând; dintr-un depozit public au fost deja indexate de GitHub și posibil copiate. Caietul de sarcini spune explicit: „La Cazuri umanitare nu se publică nume și nici diagnostice”, iar `src/date/proiecte.ts:22-28` respectă asta pe site — **dar depozitul le publică oricum**.

**Ce am verificat.** Site-ul nou **nu** randează aceste texte: `grep` pe `.next/static` și `.next/server/app` nu găsește niciun nume; paginile de proiect afișează doar titlu, dată și poze. Problema e depozitul, nu site-ul.

**Ce trebuie făcut, de cine.**
1. **Proprietarul contului GitHub, acum**: Settings → General → Danger Zone → „Change repository visibility” → Private. Nu există alt pas mai important în acest raport.
2. **Dezvoltatorul, după o decizie cu asociația**: scoaterea textelor cazurilor umanitare din `continut/proiecte.json`, `continut/articole.json` și `continut/continut.json` (site-ul nu le folosește) și rescrierea istoricului (`git filter-repo`) ca să dispară și din commit-urile vechi. **Nu am șters nimic** — `scripts/export-wordpress.xml` e dovada importului și ați cerut să nu-l ating fără să întreb. Întreb: vreți să-l păstrez în depozit (după ce devine privat) sau să-l mutăm într-un loc separat, în afara depozitului?
3. Pozele: rămân în depozit pentru că site-ul le servește de acolo. Odată depozitul privat, sunt la fel de expuse ca pe site (adică publice pe site, cum au fost și până acum). Decizia dacă pozele cazurilor umanitare se mai afișează e a asociației (caietul cere „cazurile umanitare publicabile” — lista n-a venit încă).

## 2. Antetele HTTP — reparat

**Înainte** (`curl -I http://localhost:3001/`): niciun antet de securitate; `X-Powered-By: Next.js`.

**Acum** (`next.config.ts`, `headers()` pe `/(.*)`, plus `poweredByHeader: false`):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://formular230.ro;
  style-src 'self' 'unsafe-inline' https://formular230.ro; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self'; frame-src https://formular230.ro; frame-ancestors 'none';
  object-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self';
  worker-src 'self' blob:; media-src 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
```

**Cum a fost scrisă CSP.** Am descărcat scriptul de la `https://formular230.ro/share/3a4765710d7` și am citit ce face: adaugă o foaie de stil (`/erp/deploy/client.css`), creează un `<iframe>` către `/share/<id>/form` și comunică prin `postMessage` pentru redimensionare. De aceea domeniul lor e la `script-src`, `style-src` și `frame-src`, și nicăieri altundeva. `res.cloudinary.com` intră la `img-src` **numai** când `CLOUDINARY_CLOUD_NAME` e setat, aceeași condiție ca pentru încărcătorul de imagini.

**Cele două concesii, spuse pe față:**
- `'unsafe-inline'` la **scripturi**. Next.js pune în pagină scripturi inline cu datele componentelor de server. Singura cale fără `'unsafe-inline'` e un nonce generat per cerere, într-un `src/proxy.ts`, ceea ce face ca **nicio pagină să nu mai poată fi prerandată static** — fiecare vizită s-ar randa pe loc. E o decizie de arhitectură, nu a auditului, și `src/proxy.ts` e în afara fișierelor pe care aveam voie să le ating. Până atunci riscul e mic: site-ul nu randează nicăieri text scris de vizitatori și nu folosește `dangerouslySetInnerHTML` (verificat), deci n-are prin ce să intre un script străin; celelalte directive (`frame-ancestors`, `object-src`, `base-uri`, `form-action`, lista strictă de domenii) rămân în vigoare.
- `'unsafe-inline'` la **stiluri**. React scrie atribute `style="..."` (animațiile din `motion`), iar scriptul formular230.ro setează `style.display` și `z-index` direct. Nonce-urile nu se pot pune pe atribute. Un stil injectat nu rulează cod.
- `'unsafe-eval'` apare **doar** cu `NODE_ENV=development` (pentru `next dev`); în producție nu e — verificat în antetul servit de `next start`.

**Verificat în browser (Playwright, Chromium), cu CSP activă:**
- 7 pagini (`/`, `/contact`, `/devino-voluntar`, `/doneaza`, `/directioneaza-20`, `/proiecte`, `/redirectioneaza-3-5`): **zero** evenimente `securitypolicyviolation`, zero erori în consolă;
- bannerul de cookie-uri apare, „Acceptă toate” îl închide, formularul 230 se încarcă (iframe `https://formular230.ro/share/3a4765710d7/form`, 10 câmpuri, redimensionat la 647 px);
- „Refuz” → formularul nu se încarcă, apare butonul propriu „Accept și încarcă formularul”; apăsat, formularul se încarcă;
- butonul de copiat IBAN funcționează sub Permissions-Policy;
- `next dev` pe portul 3011: zero încălcări CSP cu `'unsafe-eval'` și websocket-ul de reîncărcare.
- `node scripts/verifica-pagini.mjs http://localhost:3001` → „15 pagini verificate, nicio problemă”.

**De făcut după lansare**: `preload` la HSTS, numai după ce domeniul final e pe HTTPS cu toate subdomeniile — odată intrat în lista browserelor, nu mai iese ușor.

## 3. Rutele API — reparat

Fișiere: `src/lib/api.ts` (nou), `src/app/api/contact/route.ts`, `src/app/api/newsletter/route.ts`.

| Ce lipsea | Ce se putea întâmpla | Acum |
|---|---|---|
| Limită de dimensiune: `cerere.json()` citea tot (test: 5 MB, acceptat în 35 ms) | Memoria serverului umplută cu câteva cereri | `Content-Length` verificat, apoi octeții numărați la citire; peste 16 KB → `413`, citirea se oprește (testat și cu `Transfer-Encoding: chunked`, fără `Content-Length`) |
| Limită de rată | Formularul trimis de o mie de ori; când se conectează emailul, fiecare apel = un email către asociație **și** unul către adresa din formular (a oricui) | 6 cereri / 10 minute / adresă IP (`X-Forwarded-For`, pus de Railway), separat pe rută; a 7-a → `429` cu `Retry-After` |
| Verificarea `Content-Type` | Trimiteri din formulare HTML de pe alte site-uri | altceva decât `application/json` → `415` |
| Lungimi maxime pe câmpuri | Un „nume” de 15 KB într-un email | nume ≤ 120, mesaj ≤ 5 000, celelalte ≤ 120 caractere |
| `fel` nevalidat | Etichete arbitrare în emailul asociației | doar `contact` / `voluntariat` |
| Vârsta voluntarului verificată doar în browser | Datele unui minor ajung în emailul asociației ocolind formularul | verificată și pe server, cu același mesaj |
| Capcană pentru roboți | Spam | câmpul `site_web` completat → răspuns „a mers”, fără nicio acțiune (**formularele trebuie să-l adauge**, vezi §7) |
| `Cache-Control` pe răspunsuri | — | `no-store` |

Ce **nu** era o problemă: rutele nu scriu nimic în jurnal (niciun `console.log`), mesajele de eroare sunt pentru om și nu dezvăluie nimic intern, `GET` răspunde `405`. Am păstrat asta și am documentat în `src/lib/api.ts` de ce nu se loghează corpul.

**Limită asumată**: contorul de rată e în memoria procesului. Pentru un container pe Railway e corect; dacă site-ul ar rula vreodată pe mai multe instanțe, contorul trebuie mutat într-un loc comun (Redis sau baza de date aleasă pentru donatori). E scris în cod.

## 4. Date personale în depozit

Pe lângă §1 (critic), am căutat sistematic:

- **Comentarii, conturi, donații în `scripts/export-wordpress.xml`**: `<wp:comment>` = 0, `<wp:author>` = 0, `give_payment`/`give_donor` = 0 — **în toate versiunile din istoric** (`git log -p` pe fișier). Curățarea descrisă în CLAUDE.md s-a făcut înainte de primul commit, cum spune.
- **CNP-uri**: niciun șir de 13 cifre cu formă de CNP în `continut/` sau în export.
- **Telefoane**: singurele telefoane reale sunt cele ale asociației (`0754 510 167`, `0748 250 704`); restul potrivirilor (`0743220666`, `0726095939`…) sunt bucăți din numele fișierelor foto de pe Facebook, nu numere de telefon.
- **Adrese de email**: cele ale echipei (`paula@`, `eudochia@`, `daniel@teona-ariana.ro`) și `ata.suceava@gmail.com` — adrese organizaționale, publice și pe site-ul vechi. `admin@imperial-media.ro` și `iamelangodesigner@gmail.com` apar doar în conținutul demonstrativ al temei Risehand (`continut/continut.json:9619, 23505`). Nimic privat.
- **IP-uri**: niciunul.
- **EXIF/GPS în fotografii**: 321 fișiere scanate, zero cu metadate EXIF, zero cu coordonate GPS.
- **`continut/continut.json`** (2,6 MB, nedocumentat în CLAUDE.md): conține toate cele 164 de postări, inclusiv 35 de pagini-șablon în ciornă („Home Page 3”, „Pet Donation Drive”…), 12 formulare GiveWP la coș, textul implicit de Privacy Policy al WordPress (linia 7447) și un HTML copiat din ChatGPT (linia 27724, cu `data-message-model-slug="gpt-4o"`). Nu e o gaură de securitate, dar e un fișier mare, cu texte care nu trebuie să ajungă nicăieri, și cu cazurile umanitare din §1. Propun să se decidă dacă rămâne.

## 5. Secrete

- Căutat în arborele de lucru și în **tot istoricul** (`git log -p --all`): chei API, token-uri, `cloudinary://cheie:secret@`, `sk_live`, `AKIA…`, chei private PEM, parole. **Nimic găsit.** Singurele potriviri sunt numele variabilelor de mediu și comentariile care explică cum se setează.
- Niciun fișier `.env*`, `.pem` sau `.key` nu a fost vreodată urmărit de git; `.gitignore` acoperă `.env*` și `*.pem`.
- Cloudinary: cheia și secretul se citesc doar din mediu (`scripts/urca-in-cloudinary.mjs:40-66`, `scripts/curata-pozele-temei.mjs:62-67`); scripturile afișează doar numele contului, niciodată cheia. În browser ajunge doar `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, care oricum e în fiecare adresă de imagine.

## 6. Dependențe

`npm audit`: **5 high**, toate pe `braces` (GHSA-vfj7-8cjw-p6xm, epuizare de stivă la tipare adânc imbricate), ajuns prin `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch`. Intervalul vulnerabil e `*` — nu există versiune reparată; singura „reparație” oferită e retrogradarea la `eslint-config-next@14`, o schimbare majoră care n-are sens pe Next 16. Biblioteca rulează doar la `npm run lint`, pe mașina dezvoltatorului, cu fișiere din proiect; nu e în site. **`npm audit --omit=dev`: 0 vulnerabilități.** N-am schimbat nimic în `package.json`.

## 7. Scurgeri către terți și formulare

- **Înainte de acord**: pe prima pagină și pe `/redirectioneaza-3-5`, lista cererilor din browser nu conține niciun domeniu extern. Fonturile (Nunito, Nunito Sans, Kalam) sunt servite din `/_next/static/media/*.woff2`, prin `next/font` — confirmat în antetul `Link: rel=preload` al răspunsului. Cerința 12.5 din caiet e respectată.
- **După acord**: singurul domeniu extern e `formular230.ro`, și doar pe pagina cu formularul. Nu există niciun script de statistici sau marketing (bannerul oferă categoriile, dar nimic nu le citește încă — corect, nu se încarcă nimic „în avans”).
- **`target="_blank"`**: 6 din 6 au `rel="noopener noreferrer"` (`src/app/contact/page.tsx:253`, `src/componente/Retele.tsx:40`, `src/componente/pagina/Formular230.tsx:323`, `src/componente/formular/FormularDonatie.tsx:105`, `src/componente/formular/FormularVoluntar.tsx:232`). `Cross-Origin-Opener-Policy: same-origin` acoperă acum și un eventual link viitor care ar uita.
- **`autocomplete`**: prezent și corect pe toate câmpurile personale (`name`, `email`, `tel`, `bday`, `address-level2`, `given-name`, `family-name`); calculatorul fiscal are `autoComplete="off"`. Formularul de donație nu cere date de card — corect, până la alegerea procesatorului.
- **Roboți — de făcut de agentul de componente** (nu am voie în `src/componente/**`): în `FormularContact.tsx`, `FormularVoluntar.tsx` și `Newsletter.tsx` se adaugă un câmp capcană și se trimite în corpul cererii:

  ```tsx
  {/* Capcană pentru roboți: oamenii nu-l văd, roboții completează tot. */}
  <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
    <label htmlFor={`${id}-site-web`}>Site web</label>
    <input id={`${id}-site-web`} name="site_web" type="text" tabIndex={-1} autoComplete="off" />
  </div>
  ```
  și în `JSON.stringify({...})`: `site_web: date.get("site_web")`. Serverul deja îl tratează (`src/lib/api.ts`, `esteRobot`). Dacă spamul persistă după conectarea emailului, următorul pas e Cloudflare Turnstile (gratuit, fără cookie-uri de urmărire) — dar nu înainte, ca să nu adăugăm un terț degeaba.

## 8. Altele verificate

- Niciun `dangerouslySetInnerHTML` în `src/` (textele legale sunt împărțite în paragrafe în `TextLegal.tsx`, nu injectate ca HTML).
- Slug-urile de proiect vin dintr-o listă fixă (`generateStaticParams`); nimic din URL nu e reflectat în pagină.
- `railway.json`: healthcheck pe `/`, repornire la eșec — în regulă. Railway termină TLS-ul; HSTS-ul nostru trece mai departe.
- Scriptul formular230.ro ascultă `message` de la orice origine (codul lor, pentru redimensionare); nu e al nostru și nu face decât să schimbe înălțimea iframe-ului.
- Fișierele șablon din `public/` (`next.svg`, `vercel.svg`…) sunt inofensive, dar pot fi șterse.

## Fișiere modificate (doar în aria permisă)

- `next.config.ts` — antete de securitate, `poweredByHeader: false`
- `src/lib/api.ts` — **nou**: citire cu limită, limită de rată, validări comune, capcană
- `src/app/api/contact/route.ts`, `src/app/api/newsletter/route.ts` — folosesc `src/lib/api.ts`
- `AUDIT-SECURITATE.md` — acest raport

Nu s-a adăugat nicio bibliotecă. `npm run build` ✓ · `npm run lint` ✓ · `node scripts/verifica-pagini.mjs http://localhost:3001` ✓ · verificare în browser ✓. Niciun commit, niciun push.

## Lista de acțiuni, în ordine

1. **Proprietarul GitHub, azi**: depozitul → privat.
2. **Asociația + dezvoltatorul**: decizie despre textele cazurilor umanitare din `continut/*.json` și despre `scripts/export-wordpress.xml` (păstrat în depozit privat / mutat în afara lui) și rescrierea istoricului.
3. **Agentul de componente**: câmpul capcană `site_web` în cele trei formulare.
4. **Dezvoltatorul, când se conectează emailul**: nimic de adăugat la apărare — e deja pusă; de verificat doar că serviciul de email nu loghează corpul.
5. **După lansare**: `preload` la HSTS; dacă apare un al doilea container, contorul de rată într-un loc comun.
6. **Decizie de arhitectură, oricând**: CSP cu nonce (fără `'unsafe-inline'` la scripturi) contra prerandării statice.
