# Audit funcțional (QA) — site nou Asociația Teona Ariana Suceava

Testat pe 8 octombrie 2026, pe build-ul de producție (`npm run build && next start -p 3003`,
commit `70c6983`), cu Chromium 1194 prin Playwright, pe lățimi de 320/360/390/430 px și
1280/1440/1920 px, cu și fără JavaScript, cu și fără `prefers-reduced-motion`.
Scripturile de test sunt în `scripts/qa/` și se pot rula din nou cu `node scripts/qa/<nume>.mjs`
(serverul trebuie să asculte pe 3003; `bash scripts/qa/server.sh` îl ține pornit).

Nu am modificat nimic în `src/`. Singurele fișiere scrise: acest raport și `scripts/qa/*`.

## Rezumat

1. Site-ul funcționează în ansamblu: niciun link intern mort, toate ancorele există, validările formularelor afișează exact mesajele cerute de caiet lângă câmpul lor, calculatorul calculează corect, cookie-urile, sliderul, Formularul 230 și butoanele „Copiază” fac ce trebuie.
2. **Antetul nu încape la 1280–1440 px**: pe fiecare pagină apare bară de derulare orizontală, iar butonul „Donează” din antet e tăiat de marginea ecranului (lățimile cele mai comune de laptop).
3. **Linkurile „Susține” din „Campaniile noastre” nu preselectează destinația** (`?destinatie=casa-teona` e ignorat; donația rămâne „Oriunde e nevoie”), iar imaginea de distribuire pe Facebook/WhatsApp e generată cu adresa `http://localhost:3000/…` (lipsește `metadataBase`).
4. Un proiect are poza principală lipsă (404), o adresă veche de proiect ajunge pe pagina 404, iar două pagini de proiect fără nicio fotografie spun „îl poți vedea în fotografii”.
5. Fără JavaScript, formularele de contact, donație și newsletter trimit datele personale în adresa paginii (GET), fără niciun răspuns; pe telefon, meniul nu se poate deschide (rămân linkurile din subsol).

---

## Defecte

### A. Blochează sau induce în eroare utilizatorul

#### A1. Antetul iese din ecran la 1280–1440 px, pe toate paginile
- **Unde:** `src/componente/Antet.tsx` — meniul de desktop (`xl:flex`), de la 1280 px în sus.
- **Pași:** deschide orice pagină (ex. `/casa-teona`) într-o fereastră de 1280, 1300, 1340, 1400 sau 1440 px lățime, după ce ai ales ceva în bannerul de cookie-uri.
- **Ce ar trebui:** meniul, sigla și „Donează” încap pe un rând, fără derulare orizontală (caietul 12.1: „Meniul rămâne vizibil”; butonul Donează „evidențiat”).
- **Ce se întâmplă:** `document.scrollWidth` depășește lățimea ferestrei (1311 > 1280; 1451 > 1440). Apare bară de derulare orizontală pe toată pagina, iar „Donează” e tăiat de marginea dreaptă (se vede „Donea”). La 1366 și 1470–1600 px, „Donează” iese din containerul `max-w-7xl` (cu 31–91 px), fără bară de derulare, dar nealiniat cu restul paginii. Fonturile sunt cele reale (Nunito 600, verificate încărcate): sigla 201 px + nav 934 px (986 px de la 1400) + Donează 119 px + spații nu încap în 1280 − 64 px de margini. Comentariul din cod („încap cu 2 px în minus”) nu corespunde măsurătorii.
- **Gravitate:** supărător, dar vizibil pe **toate** paginile, la lățimile cele mai comune de laptop. Script: `scripts/qa/antet-latimi.mjs`, captură `antet-1280.png`.

#### A2. Destinația donației din „Campaniile noastre” se pierde
- **Unde:** `src/componente/acasa/Campanii.tsx` trimite la `/doneaza?destinatie=tabere|casa-teona|cazuri-umanitare`; `src/app/doneaza/page.tsx` randează `<FormularDonatie />` fără să citească `searchParams`.
- **Pași:** prima pagină → „Campaniile noastre” → butonul „Susține” de la „Casa Teona”. Sau deschide direct `/doneaza?destinatie=casa-teona`.
- **Ce ar trebui:** „Casa Teona” bifată la „Destinația donației” (linkul promite asta; componenta are chiar parametrul `destinatieInitiala`).
- **Ce se întâmplă:** rămâne bifat „Oriunde e nevoie”, pentru toate cele trei linkuri. Un donator care a ales conștient „Casa Teona” donează, fără să observe, „oriunde”.
- **Gravitate:** induce în eroare (supărător). Script: `scripts/qa/diverse.mjs`.

#### A3. Imaginea de distribuire pe rețele are adresa `http://localhost:3000/…`
- **Unde:** `src/app/layout.tsx` — `metadata` fără `metadataBase`.
- **Pași:** `curl -s http://localhost:3003/ | grep og:image`.
- **Ce ar trebui:** `og:image` și `twitter:image` cu adresa publică a site-ului (caietul 12.8 cere imagine pentru Facebook și WhatsApp).
- **Ce se întâmplă:** `<meta property="og:image" content="http://localhost:3000/opengraph-image.jpg?…">` — portul e chiar cel din build, nu cel de rulare, deci pe Railway va rămâne `localhost`. Facebook/WhatsApp nu vor afișa imaginea. Next avertizează și în jurnalul serverului: „metadataBase property in metadata export is not set”.
- **Gravitate:** blochează distribuirea cu imagine în producție. Nu există nici `<link rel="canonical">`.

#### A4. O adresă veche de proiect ajunge pe pagina 404
- **Unde:** `src/lib/redirectionari-proiecte.mjs` versus `src/date/proiecte.ts`.
- **Pași:** deschide `/portfolio/prima-tabara-respiro-%f0%9f%a7%a1-asociatia-teona-ariana/` (adresa reală din export).
- **Ce ar trebui:** 301/308 către `/proiecte/prima-tabara-respiro-asociatia-teona-ariana` (pagina există).
- **Ce se întâmplă:** 308 către `/proiecte/prima-tabara-respiro`, care arată „Pagina nu a fost găsită”. Cauza: `.mjs` lucrează pe titlul brut din JSON („…- Asociatia Teona Ariana”) și îl taie cu regexul `Asociatia Teona Ariana`; `proiecte.ts` primește titlul trecut prin `repara()` („Asociația”, cu diacritice), regexul nu se mai potrivește, iar slugul păstrează sufixul. Celelalte 30 de adrese vechi de proiect ajung corect (verificate una câte una, `scripts/qa/redirectionari-vechi.mjs`).
- **Gravitate:** blochează vizitatorul venit de pe linkul vechi (postări, presă, Google).

#### A5. Poza principală a proiectului „Prima tabără Respiro” dă 404
- **Unde:** `continut/proiecte.json`, câmpul `pozaPrincipala` al proiectului; `public/poze/2024/11/`.
- **Pași:** `/proiecte` → „Proiecte 2021 – 2024” → ultimul card, „Prima tabără Respiro”; sau deschide pagina proiectului.
- **Ce ar trebui:** fotografia să se vadă în card și în antetul paginii.
- **Ce se întâmplă:** cardul și pagina cer `/_next/image?url=/poze/2024/11/187237065_…_n-1024x485.jpg` → **404**, eroare în consolă, iar Next scrie „internal image response failed” în jurnal. Pe disc există doar originalul `187237065_…_n.jpg` (fără sufixul de redimensionare WordPress). Singurul 404 găsit la parcurgerea tuturor celor 43 de pagini.
- **Gravitate:** supărător (pagină cu poză spartă).

#### A6. Pagini de proiect fără fotografii spun „îl poți vedea în fotografii”
- **Unde:** `src/app/proiecte/[slug]/page.tsx` folosește doar `proiect.poze`; lista (`ListaProiecte.tsx`) folosește `proiect.coperta`.
- **Pași:** `/proiecte/pastram-amintirile-frumoase-in-inimile-noastre-multumim-pentru-implicare` și `/proiecte/daruieste-din-inima-si-ajuta-o-inima-bolnava`.
- **Ce ar trebui:** fie să apară coperta (există `pozaPrincipala`, cardul din listă o afișează), fie textul să nu promită fotografii.
- **Ce se întâmplă:** pagina are **0 imagini** (nici copertă, nici galerie), dar caseta spune „Descrierea acestui proiect se scrie împreună cu asociația. Până atunci, îl poți vedea în fotografii.” Cardul din listă, în schimb, are poză. Pagina minte despre ce conține.
- **Gravitate:** supărător.

### B. Supărătoare

#### B1. „1.000” în „Altă sumă” devine 1 leu
- **Unde:** `FormularDonatie.tsx`: `Number(altaSuma.replace(",", "."))`.
- **Pași:** `/doneaza` → „Altă sumă (lei)” → scrie `1.000` (o mie, cum scriu românii).
- **Ce ar trebui:** 1000 lei, sau mesajul „Introdu o sumă validă, în lei.” Calculatorul din `/directioneaza-20` interpretează corect punctul ca separator de mii — formularul de donație, nu.
- **Ce se întâmplă:** butonul devine „Donează 1 lei lunar”. Tot acolo: `1e3` → „Donează 1000 lei”, `0x10` → „Donează 16 lei”, `0,001` → „Donează 0.001 lei” (acceptată sub un ban).
- **Gravitate:** supărător (cât timp plata nu e conectată nu produce pagube; la conectare devine grav).

#### B2. Fără JavaScript, formularele trimit datele personale în adresa paginii
- **Unde:** `FormularContact.tsx`, `FormularDonatie.tsx`, `Newsletter.tsx` — `<form>` fără `action`/`method`.
- **Pași:** dezactivează JavaScript → `/contact` → completează numele și emailul → Enter (sau clic pe „Trimite mesajul”).
- **Ce ar trebui:** fie să meargă pe o cale fără JS, fie să nu trimită nimic; în niciun caz emailul în URL.
- **Ce se întâmplă:** pagina se reîncarcă la `/contact?nume=Ana+Pop&email=ana%40example.com&telefon=&interes=…&mesaj=` — fără niciun mesaj. La fel `/doneaza?alta=50&…&email=…` și `/?email=…&acord=da` (newsletter). Adresa cu date personale ajunge în istoricul browserului și în jurnalele serverului. Formularul de voluntariat nu are butonul de trimitere la pasul 1, deci acolo Enter nu face nimic.
- **Gravitate:** supărător (doar fără JS, dar e date personale).

#### B3. Hover apoi clic pe „Redirecționează” închide submeniul
- **Unde:** `Antet.tsx` — `onMouseEnter` deschide, `onClick` comută.
- **Pași:** desktop ≥1280 → mută mouse-ul peste „Redirecționează” (se deschide) → dă clic pe el.
- **Ce ar trebui:** submeniul rămâne deschis (clicul confirmă, nu anulează).
- **Ce se întâmplă:** `aria-expanded` devine `false`, submeniul dispare sub mouse; al doilea clic îl redeschide. Mulți utilizatori dau clic instinctiv după hover.
- **Gravitate:** supărător.

#### B4. Escape nu închide meniul de telefon
- **Pași:** 390 px → apasă hamburgerul → apasă Escape.
- **Ce ar trebui:** meniul se închide (cum face submeniul de desktop la Escape).
- **Ce se întâmplă:** rămâne deschis (`aria-expanded="true"`, `body { overflow: hidden }`). Se închide doar din buton sau la navigare. Escape nu închide nici bannerul de cookie-uri (acolo e discutabil, bannerul cere o alegere).
- **Gravitate:** supărător (tastatură/accesibilitate).

#### B5. `/proiecte/<slug inexistent>` răspunde HTTP 200
- **Pași:** `curl -I http://localhost:3003/proiecte/nu-exista`.
- **Ce ar trebui:** 404, ca la `/adresa-inventata` (care răspunde corect 404).
- **Ce se întâmplă:** 200 cu antete `x-nextjs-prerender`, `x-nextjs-postponed`, deși conținutul e pagina 404. Google o va trata ca pagină reală („soft 404”); A4 e agravat de asta.
- **Gravitate:** supărător (SEO), invizibil pentru om.

#### B6. Formularul 230 nu se încarcă dacă browserul blochează stocarea
- **Unde:** `Formular230.tsx`, `formularPermis()` citește `localStorage` după `acceptaFormularul()`.
- **Pași:** `/redirectioneaza-3-5` → blochează `localStorage` (navigare privată cu date de site blocate; simulat prin `Object.defineProperty(window,"localStorage",{get(){throw}})`) → „Accept și încarcă formularul”.
- **Ce ar trebui:** comentariul din cod promite „fără memorie, formularul se încarcă acum și se reîntreabă data viitoare”.
- **Ce se întâmplă:** butonul nu face nimic; blocul de acord rămâne pe loc. Rămân căile alternative (descarcă/Casa Teona), deci nu e blocant.
- **Gravitate:** supărător, rar.

#### B7. Fără JavaScript, meniul de telefon nu se deschide
- **Pași:** JS dezactivat, 390 px → hamburgerul.
- **Ce se întâmplă:** butonul nu face nimic; meniul rămâne `inert`, înălțime 0. Navigarea rămâne posibilă prin subsol (toate cele 11 linkuri) și prin butonul plutitor „Donează” (care e în HTML). Bara de anunț, bannerul de cookie-uri, filtrele de proiecte (apar toate 28 de carduri, taburile nu fac nimic), calculatorul și Formularul 230 nu funcționează fără JS, dar paginile rămân citibile și nimic nu e ascuns (verificat: 0 elemente cu text la `opacity: 0`).
- **Gravitate:** supărător doar pentru vizitatorii fără JS.

#### B8. Erorile bifei de acord nu sunt legate de bifă pentru cititoarele de ecran
- **Unde:** `Camp.tsx`, componenta `Bifa` — `aria-invalid` există, dar `<Eroare>` nu primește `id` și bifa nu are `aria-describedby`. Afectează donație, contact și voluntariat.
- **Pași:** `/doneaza` → „Donează lunar” fără nimic completat → inspectează `input[name=acord]`.
- **Ce se întâmplă:** `aria-describedby="null"`; mesajul „Bifează acordul pentru a continua.” e vizibil, la 50 px sub bifă, dar nu e anunțat împreună cu câmpul. La „Altă sumă” și „Email” legătura există și e corectă.
- **Gravitate:** supărător (accesibilitate).

#### B9. Mesajul „Nu am putut copia automat…” nu e anunțat
- **Unde:** `DeCopiat.tsx` — `<p>` fără `role="status"`/`aria-live` (succesul are `role="status"`, eșecul nu).
- **Pași:** blochează clipboard-ul (`navigator.clipboard.writeText` → `NotAllowedError`) → „Copiază”.
- **Ce se întâmplă:** mesajul apare vizual, cinstit, textul rămâne selectabil (bine), dar un cititor de ecran nu aude nimic.
- **Gravitate:** supărător (accesibilitate).

#### B10. Bannerul de cookie-uri e ultimul în ordinea de tabulare și acoperă subsolul
- **Pași:** prima vizită, 1440×900 → Tab repetat: bannerul se atinge după **57** de apăsări (după tot subsolul). Cu bannerul deschis, linkul „Donează” din subsol e sub banner (`elementFromPoint` dă bannerul) și nu poate fi apăsat până nu alegi ceva.
- **Ce ar trebui:** bannerul să fie accesibil devreme (sau focalizat la apariție).
- **Gravitate:** supărător (tastatură); pe telefon de 320×568 bannerul ocupă 56% din ecran, dar toate butoanele rămân vizibile.

### C. Cosmetice / minore

- **C1.** Sume cu zecimale în butonul de donație apar cu punct: „Donează 12.5 lei lunar” pentru `12,50` (`FormularDonatie.tsx`, `etichetaButon`).
- **C2.** Calculator: rezultatele cu o zecimală apar fără a doua („19.753.086,4 lei” în loc de „19.753.086,40 lei”) — `Intl.NumberFormat` cu `minimumFractionDigits: 0`. `1.2500` e citit ca 1,25 lei fără avertisment (ambiguu). Matematic totul e corect (vezi mai jos).
- **C3.** Newsletter: erorile („Introdu o adresă de e-mail validă.”, „Bifează acordul”) vin de la server, într-o casetă generală, nu lângă câmp, fără `aria-invalid`; câmpurile au `required`, dar `noValidate` îl anulează. Singurul formular care nu respectă modelul celorlalte.
- **C4.** Filtrul ales la `/proiecte` nu e în URL: după reîncărcare sau la revenire din pagina unui proiect se pierde. Taburile (`role="tab"`) nu răspund la săgeți (toate sunt în ordinea de tabulare; funcțional, dar nu e modelul ARIA de tablist).
- **C5.** După mesajul „Plata cu cardul… se conectează acum”, linkurile „Donează lunar prin SMS” și „Transfer bancar” readuc formularul: „Altă sumă” rămâne (30), emailul se pierde (câmp necontrolat remontat).
- **C6.** Formularul de voluntariat: Enter într-un câmp de la pașii 1–2 nu face nimic (nu există buton de trimitere în pas) — nu avansează la pasul următor.
- **C7.** Adresele vechi cu bară finală fac două salturi (`/despre/` → `/despre` → `/despre-noi`); funcționează, dar e o redirecționare în plus. Redirecționările sunt 308, nu 301 (echivalent pentru motoare).
- **C8.** `/robots.txt`, `/sitemap.xml` și `/favicon.ico` răspund 404. Favicon-ul merge prin `<link rel="icon">` (`app/icon.png`), deci nu e vizibil. Caietul nu cere robots/sitemap; le menționez pentru lansare.
- **C9.** Inputurile au `outline-none` și arată focalizarea doar prin schimbarea culorii chenarului (`focus:border-caramiziu-400`); e vizibilă, dar mai discretă decât inelul de 3 px de pe butoane și linkuri.
- **C10.** Cu meniul de telefon deschis (`body { overflow: hidden }`), Tab-ul iese din meniu în conținutul paginii de dedesubt (nu e capcană, dar derulează pagina blocată).
- **C11.** În jurnalul consolei apar cereri `?_rsc=…` cu `net::ERR_ABORTED` la navigare — sunt prefetch-uri anulate de Next, nu erori reale. Singura eroare de consolă reală pe tot site-ul e 404-ul de la A5 (plus 503-urile așteptate de la `/api/contact` și `/api/newsletter`).

---

## Ce am testat și e în regulă

**Parcursul „Vreau să donez”.** Toate căile de pe prima pagină duc la `/doneaza`: butonul din antet, „Donează acum” din erou, cardul 1 „Donează acum”, „Donează” din subsol, meniul de telefon, butonul plutitor (apare pe telefon după alegerea cookie-urilor, dispare pe `/doneaza`). Cardul SMS duce la `/doneaza#sms` și secțiunea apare în ecran (top 240 px, sub antetul lipit). Formularul: „Lunar” preselectat, „Oriunde e nevoie” implicită, newsletter nebifat, acord nebifat; butoanele 20/50/100 scriu suma în buton („Donează 50 lei lunar” / „Donează 100 lei” la „O dată”); alegerea unei sume predefinite golește „Altă sumă” și invers. Mesajele de eroare sunt **exact** cele din caietul 2.2 și stau lângă câmpul lor (sumă 8 px sub câmp, email 37 px, acord sub bifă), cu `aria-invalid` și `aria-describedby` corecte la sumă și email: gol → „Alege sau scrie suma pe care vrei să o donezi.”; `0`, `-5`, `abc`, `Infinity`, `5 lei` → „Introdu o sumă validă, în lei.”; email gol/`abc`/`abc@`/`abc@x`/`a b@x.ro` → „Introdu o adresă de e-mail validă.”; acord nebifat → „Bifează acordul pentru a continua.”. `12,50` și ` 25 ` sunt acceptate. După trimitere validă apare mesajul cinstit despre procesatorul neales, cu Galantom (link extern corect), SMS, transfer, email și telefon — nu se preface că încasează. Pictogramele cardurilor și „Plată securizată…” sunt sub buton, cum cere caietul.

**Parcursul „Vreau să mă fac voluntar”.** Nu se poate sări peste pasul 1: „Continuă” cu câmpurile goale arată cele trei erori. Vârsta: născut exact azi acum 18 ani → trece; ieri acum 18 ani → trece; mâine acum 18 ani (17 ani și 364 de zile) → „Ne bucurăm că vrei să te implici! Deocamdată putem primi voluntari doar de la 18 ani.” (textul din caiet, cuvânt cu cuvânt), formularul nu avansează. Dată în viitor → același mesaj; dată invalidă → browserul o respinge, apare „Completează data nașterii.”. Înapoi/înainte păstrează tot ce ai scris (nume, telefon, localitate, Zilnic, limbi, motiv); dacă schimbi data la minor și apeși Continuă, ești oprit din nou. Trimitere fără acord → „Bifează acordul pentru a continua.” la pasul 3. Două clicuri rapide pe „Trimite” → **o singură** cerere POST (butonul se dezactivează, „Se trimite…”). Răspunsul 503 e afișat cinstit, cu email și telefon, într-un `role="alert"`. Titlul pasului primește focalizarea la schimbarea pasului.

**Contact.** Nume sub 2 litere sau doar spații, email greșit, mesaj sub 5 caractere sau doar spații, acord nebifat — fiecare cu mesajul lui lângă câmp, `aria-invalid` și `aria-describedby` corecte. Alegerile „Sunt interesat de” sunt cele cinci din caiet, prima preselectată. După trimitere validă, 503-ul e afișat cinstit, butonul se reactivează, valorile rămân.

**Calculatorul (8.4).** Verificat matematic: 1.000.000 / 100.000 → 7.500 lei, limitat de 0,75 % din cifra de afaceri (20 % din impozit = 20.000); 1.000.000 / 10.000 → 2.000 lei, limitat de 20 % din impozit (0,75 % = 7.500); 100.000 / 3.750 → 750 = 750, ambele marcate; 1.250.000,50 / 120.000,25 → 9.375 și 24.000,05; 123.456.789.012 / 98.765.432 → 19.753.086,4 și 925.925.917,59 (corect). Acceptă `2 500 000`, `2.500.000 lei`, virgulă și punct zecimal. Negativ → „Suma nu poate fi negativă.”; text și `1e6` → „Scrie suma doar în cifre, de exemplu 250.000.”; peste 10^15 → mesajul de zero în plus; un singur câmp completat → nimic (fără NaN). „Calculul este orientativ.” e sub rezultat, cum cere caietul.

**Formularul 230 (7.10, 12.5).** Fără acord: **zero** cereri către `formular230.ro`, niciun script în pagină; apare blocul „Completează Formularul 230 direct aici” cu butonul propriu. „Refuz” în banner → tot nimic. „Accept și încarcă formularul” → scriptul lor se încarcă, iframe-ul apare, acordul e salvat separat (`teona:acord-formular230`). Un „Refuz” dat ulterior din subsol anulează acordul: formularul dispare, iar după reîncărcare rămâne dispărut. „Acceptă toate” încarcă formularul fără al doilea clic; doar „Marketing” bifat nu e suficient (bine). Căile alternative (descarcă, Casa Teona) rămân mereu vizibile.

**„Copiază”.** Pe `/doneaza`, `/redirectioneaza-3-5`, `/directioneaza-20`, `/contact` se copiază exact ce trebuie: IBAN-urile fără spații (`RO16RNCB0234185233660001`, `RO57BACX0000002109403001`, `RO30BACX0000002109403002`), denumirea legală, CIF-ul `43533953`. Butonul devine „Copiat” și cititorul de ecran primește „BCR (RON) a fost copiat.”; după 2,5 s revine. Clipboard refuzat sau inexistent → „Nu am putut copia automat. Selectează textul și copiază-l cu mâna.”, fără erori în consolă, textul rămâne `select-all`.

**Sliderul.** Trece singur la 7 s; butoanele (ținte de 44 px, `aria-label` „Fotografia 2: Parcul de aventură”, `aria-current`) schimbă poza și legenda (`aria-live`); se **oprește** la mouse deasupra și la focalizare de la tastatură (bara de progres îngheață), repornește când pleci; Enter și Space merg; inelul de focalizare e vizibil (3 px portocaliu). Cu `prefers-reduced-motion: reduce` nu mai avansează singur, dar clicul manual merge și tranzițiile sunt oprite.

**Meniul.** Ordinea și intrările sunt cele din caietul 12.1; „Redirecționează” se desface în cele două pagini; se deschide la hover și la Enter, se închide la Escape (focusul rămâne pe buton), la plecarea mouse-ului și când Tab-ul iese din grup; linkurile ascunse nu sunt tabulabile (`visibility: hidden`); pagina curentă e marcată (`aria-current="page"`, liniuța). Antetul e `sticky` la derulare. Pe telefon: hamburger cu `aria-expanded`/`aria-controls`/etichetă care se schimbă, meniu `inert` când e închis (Tab-ul sare peste el), toate cele 10 pagini + Donează + cele două telefoane, se închide la navigare, derulează intern la 320×568. Sub 360 px „Donează” din antet rămâne doar inimă, cu `aria-label`.

**Bannerul de cookie-uri.** Textul și cele trei butoane din caietul 12.5; „Setări” arată Necesare (mereu active), Statistici, Marketing, nebifate; „Salvează alegerea”, „Refuz” și „Acceptă toate” se țin minte în `localStorage` (verificat după reîncărcare și la navigare); „Setări cookie-uri” din subsol îl redeschide cu bifele salvate și permite schimbarea. Bara de anunț se închide și nu reapare în sesiune, dar reapare într-o sesiune nouă (12.2).

**Proiecte.** Patru categorii în ordinea cerută; se deschide pe prima categorie cu proiecte (28 în 2021–2024, 3 Cazuri umanitare); categoriile goale arată „Pregătim această secțiune.”; cardurile au titlu, dată (`<time datetime>`), număr de fotografii, ordine descrescătoare; toate cele 31 de pagini de proiect se deschid, cu titlu, dată, categorie, galerie (singura problemă: A5, A6).

**Linkuri și adrese.** Parcurgere automată a tuturor celor 43 de pagini: 0 linkuri interne moarte, 0 ancore lipsă (`#sms`, `#transfer`, `#ziua-ta`, `#firme`, `#documente`, `#formular`, `#transparenta` există). Redirecționări (308 permanent): `/despre`, `/echipa`, `/resurse` → `/despre-noi`; `/casateona` → `/casa-teona`; `/sponsori` → `/sponsori-si-parteneri`; `/35-2` → `/redirectioneaza-3-5`; `/cookies` → `/politica-de-cookieuri`; `/gdpr` → `/politica-de-confidentialitate`; `/contact-us` → `/contact`; `/faqs`, `/campanii`, `/shop`, `/cart`, `/donations` → `/doneaza`; `/events`, `/blog` → `/proiecte`; articolele vechi și cele două adrese ale raportului 2025 → paginile lor; `/portfolio/<orice>` necunoscut → `/proiecte`; 30 din 31 de adrese vechi de proiect (cu emoji) → pagina corectă. Pagina 404 are titlul, textul și cele două butoane din caietul 12.7, `noindex`, și răspunde HTTP 404 pentru adrese inventate (`/adresa-inventata-xyz`).

**Tastatură.** „Sari la conținut” e primul element, devine vizibil la focalizare (116×28 px, sus-stânga), iar Enter duce focusul în `#continut` — următorul Tab sare peste cele 11 opriri din antet. Pe toate paginile se ajunge la fiecare element din antet, conținut și subsol și înapoi la început; **nicio capcană de focalizare**; niciun element invizibil nu primește focus; linkurile și butoanele au inel de 3 px. Submeniul și meniul de telefon se pot opera de la tastatură.

**Fără JavaScript.** Toate paginile rămân citibile: titluri, texte, poze (0 imagini goale), linkuri, întrebările frecvente (`<details>`, se deschid), butonul plutitor Donează, subsolul cu toate linkurile. Vezi B2 și B7 pentru ce nu merge.

**`prefers-reduced-motion: reduce`.** Pe `/`, `/doneaza`, `/proiecte`, `/devino-voluntar`, `/casa-teona`, `/despre-noi`: 0 animații active (petele, semnele plutitoare, bara sliderului, aparițiile la derulare — toate oprite), 0 tranziții ≥ 0,5 s, fâșia de fotografii oprită (durată 0,00001 s), sliderul static.

**Lățimi.** 320, 360, 390, 430 px: **nicio** derulare orizontală pe niciuna dintre cele 15 pagini testate; formularele, calculatorul, IBAN-urile, subsolul (două coloane de la 360 px, email cu `overflow-wrap`), bannerul de cookie-uri încap. 1920 px: fără probleme. 1280 și 1440 px: vezi A1 (antetul), restul paginii e în regulă.

**Consolă și rețea.** Pe toate paginile: 0 erori JavaScript (`pageerror`), 0 avertismente ale site-ului; singurele răspunsuri ≥ 400 sunt 404-ul de la A5 și 503-urile intenționate ale API-urilor de contact/newsletter.

**Lipsuri cunoscute, confirmate, dar neraportate ca defecte** (sunt în `continut/stadiu-caiet.md` și paginile spun deschis că lipsesc): plata cu cardul, trimiterea formularelor de contact/voluntariat, abonarea la newsletter, cele cinci documente („În pregătire la asociație”, fără buton), descrierile proiectelor, proiectele 2025/2026, conturile Culegătorilor de Zâmbete, statisticile de vizite.

---

## Notă despre mediul de test

Serverul a fost pornit de trei ori: în timpul auditului, un `pkill -f "next start"` lansat de mine a oprit și procesul `sh -c next start` (PID 30313) pornit din checkout-ul principal `/home/user/teona` de altcineva — copilul lui `next-server` (PID 30314) a rămas în viață, dar portul lui nu mai răspundea nici înainte (nu l-am verificat înainte de a-l opri; cer scuze dacă era al altui agent). Apoi procesul meu a fost oprit din exterior de două ori; de aceea `scripts/qa/server.sh` repornește serverul singur.
