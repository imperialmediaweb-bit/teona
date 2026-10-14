# Audit SEO — site nou teona-ariana.ro

Data: 8 octombrie 2026 · Ramura de lucru: copie izolată a depozitului (fără commit)

## Pe scurt, pentru client

1. Fiecare pagină are acum titlu, descriere și adresă canonică proprii, scrise pentru oameni, cu „Suceava”, „copii cu nevoi speciale”, „autism”, „sindrom Down”, „tabere RESPIRO” și „Casa Teona” acolo unde se potrivesc natural.
2. Distribuirea pe Facebook, WhatsApp și X funcționează pe toate paginile: înainte, doar prima pagină avea imagine de previzualizare, iar adresa din previzualizare era `localhost:3000`.
3. Google primește `sitemap.xml` (46 de adrese, cu toate proiectele), `robots.txt` și date structurate: asociația ca organizație (CIF, adrese, telefoane, rețele), firul de navigare pe fiecare pagină și întrebările frecvente de pe Donează, 3,5% și 20%.
4. Toate cele 60 de fotografii folosite pe site au fost deschise și comparate cu descrierea lor; 16 descrieri erau greșite sau prea vagi (una spunea „petrecere” la o vizită într-o casă săracă, alta „Ministerul Justiției” pe un certificat ANAF) și au fost rescrise după ce m-am uitat la poză.
5. Nu s-a pierdut nimic din ce are site-ul vechi: redirecționările 301 existau deja; în plus, adresa de previzualizare de pe Railway nu mai poate fi indexată de Google ca o copie a site-ului.

## Ce era greșit

| # | Problema | Unde |
|---|---|---|
| 1 | Prima pagină nu avea deloc metadate proprii: titlul era doar numele asociației, descrierea era fraza generală. Despre noi folosea **aceeași** descriere ca prima pagină (conținut duplicat). Sponsori („Mulțumim companiilor care ne sunt alături.”) și Presa („Presa, alături de misiunea noastră.”) aveau descrieri de 6 cuvinte. Paginile de proiect și cele trei pagini legale nu aveau descriere deloc. | `src/app/**/page.tsx` |
| 2 | `metadataBase` lipsea: build-ul avertiza de trei ori, iar `og:image` se rezolva la `http://localhost:3000/...`. | `layout.tsx` |
| 3 | `og:image` exista **doar pe prima pagină**: fișierul `app/opengraph-image.jpg` nu se moștenește pe rutele interioare (verificat pe HTML-ul randat). Niciun `og:url`, niciun card Twitter. | toate paginile interioare |
| 4 | Nu exista `sitemap.xml`, nici `robots.txt`. | — |
| 5 | Nicio dată structurată. | — |
| 6 | 16 texte alternative greșite sau vagi (lista mai jos); pe paginile de proiect, toate pozele aveau același alt („Fotografie din proiectul X”). Certificatul de pe Contact era descris ca emis de Ministerul Justiției — e certificatul de înregistrare **fiscală**, de la ANAF. | pagini + 4 componente |
| 7 | Structura titlurilor era corectă: un singur `h1`, fără sărituri, pe toate cele 17 pagini verificate. Nimic de reparat. | — |
| 8 | „Află mai multe” (Casa Teona, prima pagină) și „Află cum” (Donează) nu spuneau unde duc. Linkuri moarte: niciunul (toate ancorele `#…` au țintă, toate rutele există). | prima pagină, Donează |
| 9 | Imaginile cu `priority` erau puse corect (eroul, antetul paginilor, prima poză a proiectului); `sizes` corecte peste tot. Ce încetinește: vezi „Rămâne de făcut”. | — |
| 10 | `lang="ro"`, diacritice și adrese fără diacritice: în regulă (scriptul `verifica-pagini.mjs` trece). | — |
| 11 | Nicio pagină nu avea `canonical`. | toate |

## Ce am reparat

**Fișier nou `src/app/seo.tsx`** — un singur loc pentru adresa site-ului, metadatele unei pagini și datele structurate. Toate paginile îl folosesc.

- `ADRESA_SITE`: vine din variabila de mediu `ADRESA_SITE`, implicit `https://teona-ariana.ro`. **La lansare nu trebuie schimbat nimic.** Până atunci, pentru previzualizări corecte de pe Railway, se poate seta `ADRESA_SITE=https://site-production-641f.up.railway.app` în Railway — și atunci, intenționat, `robots.txt` interzice tot și fiecare pagină primește `noindex` (`INDEXABIL`), ca Google să nu indexeze copia de previzualizare. Testat cu un build separat: pe Railway → `Disallow: /` + `noindex`; implicit → `Allow: /` + `index, follow`.
- `metadate({ titlu, descriere, cale })`: titlu prin șablonul din layout, descriere, `alternates.canonical`, Open Graph complet (`title`, `description`, `url`, `siteName`, `locale: ro_RO`, `type`, `images`) și Twitter (`summary_large_image`). Imaginea implicită e `/opengraph-image.jpg` (1200×630, deja existentă); paginile de proiect trimit prima lor fotografie.
- `jsonLdAsociatie()`: `NGO` + `WebSite` cu numele, numele legal, CIF, e-mail, cele două telefoane, sediul social, Casa Teona (cu cod poștal), rețelele. **Fără cifre, fără an de înființare.** Se randează din `layout.tsx`, pe fiecare pagină.
- `jsonLdFir()`: `BreadcrumbList` pe fiecare pagină interioară (Acasă › pagina; proiectele: Acasă › Proiecte › proiect; raportul: Acasă › Despre noi › Raport).
- `jsonLdIntrebari()` + `textDin()`: `FAQPage` pe Donează (6 întrebări), Redirecționează 3,5% (4), Direcționează 20% (4). Textul răspunsurilor e extras **din același JSX** care se afișează pe pagină (listele au fost mutate într-o constantă `INTREBARI`), deci nu poate diverge de ce vede omul — condiția Google pentru FAQ.

**`src/app/layout.tsx`**: `metadataBase`, `keywords` (Google nu le citește, dar nu costă nimic și clientul le-a cerut), Twitter implicit, `robots` în funcție de `INDEXABIL`, `max-image-preview:large`, blocul JSON-LD al asociației. Avertismentul `metadataBase` a dispărut din build.

**`src/app/sitemap.ts`**: cele 15 rute din `RUTE` + 31 de proiecte din `proiecteAfisate()` = 46 de adrese. Fără `lastModified` (data proiectului e data postării, nu a modificării paginii) și fără `priority`/`changefreq` (ignorate de Google).

**`src/app/robots.ts`**: `Allow: /`, `Disallow: /api/`, `Sitemap:`; pe adresă de previzualizare, `Disallow: /`.

**Paginile de proiect (`proiecte/[slug]/page.tsx`)**: descriere, canonical, `og:image` cu fotografia proiectului, fir de navigare, slug inexistent → `noindex`. Fotografiile au alt numerotat („Titlu — fotografia 3 din 12”) în loc de 12 alt-uri identice.

**Linkuri**: „Află mai multe” → `Află mai multe <span class="sr-only">despre Casa Teona</span>`; „Află cum” (Donează) → `… <span class="sr-only">să direcționezi 20%</span>`. Textul vizibil, cerut de caiet, nu s-a schimbat; cititoarele de ecran și motoarele primesc destinația.

**Casa Teona**: fotografia de la blocul „Petreceri” (legendă „Minipetrecere”) nu era o petrecere, ci o vizită a voluntarilor într-o cameră modestă, la un caz umanitar, cu chipurile copiilor — caietul interzice chipuri la cazuri umanitare. A fost înlocuită cu atelierul de brățări de la Casa Teona (legendă „La Casa Teona”). Din galerie au fost scoase două fotografii din aceeași categorie (fetițele cu cadouri de Crăciun, copiii cu jucării de pluș pe pat) — erau vizite acasă, nu Casa Teona. Aceleași două poze rămân în banda de fotografii de pe prima pagină (acolo nu am voie să schimb decât alt-ul) — **vezi „Rămâne de făcut”**.

## Titlurile și descrierile puse (de citit de client)

Șablon: `<titlu> · Asociația Teona Ariana Suceava`. Descrierile au 100–159 de caractere (Google afișează ~155).

| Pagina | Titlu | Descriere |
|---|---|---|
| `/` | Asociația Teona Ariana Suceava · ONG pentru copii cu dizabilități *(fără șablon)* | Tabere RESPIRO, Casa Teona și sprijin pentru copiii cu autism, sindrom Down sau alte nevoi speciale și familiile lor, în Suceava. Donează sau fii voluntar. |
| `/despre-noi` | Despre noi | Povestea Asociației Teona Ariana Suceava, din 2021: taberele RESPIRO, Casa Teona, echipa, voluntarii Culegătorii de Zâmbete și partenerii instituționali. |
| `/casa-teona` | Casa Teona | Casa Teona, Strada Zamca 22, Suceava: copiii cu nevoi speciale învață prin joacă, părinții găsesc consiliere. Gratuit, luni–vineri, pe bază de programare. |
| `/proiecte` | Proiecte | Proiectele Asociației Teona Ariana Suceava, pe ani și categorii: tabere RESPIRO pentru copii cu autism și sindrom Down, Casa Teona și cazuri umanitare. |
| `/proiecte/<slug>` | *titlul proiectului* | „*Titlu* — proiect al Asociației Teona Ariana Suceava. *N* fotografii.” |
| `/sponsori-si-parteneri` | Sponsori și parteneri | Firmele care sprijină taberele RESPIRO, Casa Teona și cazurile umanitare ale Asociației Teona Ariana Suceava, și cum poate firma ta să li se alăture. |
| `/redirectioneaza-3-5` | Redirecționează 3,5% | Formularul 230: redirecționezi 3,5% din impozitul pe venit către Asociația Teona Ariana Suceava, fără niciun cost. Pași, documente și termenul de 25 mai. |
| `/directioneaza-20` | Direcționează 20% | Firma ta poate sponsoriza Asociația Teona Ariana Suceava din impozitul pe profit, prin contract de sponsorizare sau Declarația 177. Calculator și documente. |
| `/suntem-in-presa` | Suntem în presă | Articole despre Asociația Teona Ariana Suceava în Monitorul de Suceava, Obiectiv de Suceava, Suceava News și suceava.online: tabere RESPIRO și evenimente. |
| `/devino-voluntar` | Devino voluntar | Alătură-te Culegătorilor de Zâmbete, voluntarii Asociației Teona Ariana Suceava, în tabere și la Casa Teona. Completezi formularul, te contactăm. De la 18 ani. |
| `/contact` | Contact | Telefon 0754 510 167, e-mail contact@teona-ariana.ro, Casa Teona pe Strada Zamca 22, Suceava. Formular de contact și paginile de Facebook, Instagram, TikTok. |
| `/doneaza` | Donează | Donează pentru copiii cu nevoi speciale din Suceava: cu cardul, lunar prin SMS cu SUSTIN la 8835, prin transfer bancar sau de ziua ta. Întrebări frecvente. |
| `/raport-de-activitate-2025` | Raport de activitate 2025 | Raportul anual 2025 al Asociației Teona Ariana Suceava: tabere RESPIRO, Casa Teona, campanii sociale, parteneri, sponsori, venituri și cheltuieli. |
| `/politica-de-confidentialitate` | Politica de confidențialitate | Ce date personale colectează Asociația Teona Ariana Suceava de la donatori, voluntari și vizitatori, cum le folosește și ce drepturi ai. |
| `/termeni-si-conditii` | Termeni și condiții | Condițiile de utilizare a site-ului teona-ariana.ro și a serviciilor Asociației Teona Ariana Suceava. |
| `/politica-de-cookieuri` | Politica de cookie-uri | Ce cookie-uri folosește site-ul Asociației Teona Ariana Suceava, la ce servesc și cum le poți accepta sau refuza. |
| 404 | Pagina nu a fost găsită *(noindex, neschimbat)* | — |

Titlul paginii Despre noi era „Cine suntem” (titlul `h1` din caiet rămâne „Cine suntem”); în rezultatele Google e mai util numele din meniu, „Despre noi”.

## Textele alternative rescrise (după ce m-am uitat la fiecare poză)

| Fișier | Era | Acum |
|---|---|---|
| `413839128…n.jpg` (Despre noi, Contact, Voluntar, bandă) | „Voluntari și copii, în grup, la apus” | „Opt voluntari tineri, în veste albe cu sigla asociației, în grup, la apus” — nu e niciun copil în poză |
| `412883312…n.jpg` (bandă prima pagină) | „Copii și adulți la o petrecere, într-o sală decorată” | „Voluntari în veste albe cu sigla asociației, într-o cameră modestă, alături de o familie cu copii mici și pungi cu daruri” |
| `144023475…n.jpg` (bandă) | „Doi copii cu un tort, la o aniversare” | „Două fetițe țin în brațe cadouri împachetate în hârtie de Crăciun, pe o canapea, acasă” |
| `413874579…n.jpg` (scoasă din galeria Casa Teona) | „Copii se joacă cu jucării de pluș pe o canapea, lângă un perete pictat cu cer și nori” | — (voluntari dau jucării de pluș unor copii, pe un pat, într-o cameră cu pereți scorojiți) |
| `339454935…-1.jpg` (Casa Teona, bandă) | „Un copil se joacă pe covor cu piese colorate și creioane” | „O fetiță îl sărută pe obraz pe un băiețel; stau pe covor, între bețișoare colorate, un puzzle cu forme și cuburi” |
| `Certificat-de-inregistrare-ATA` (Contact) | „…emis de Ministerul Justiției” | „Certificatul de înregistrare fiscală …, emis de ANAF, cu CIF 43533953” |
| `351164060…n.webp` (Sponsori, 20%, bandă) | „…litere care formează cuvântul „Mulțumim”” | „Copii și adulți în tricouri EGGER țin litere care formează „Mulțumim Egger”, în fața unui hambar de lemn negru cu o lună aurie și textul „Love you to the moon and back”” |
| `438101549…n.jpg` (Voluntar) | „Opt voluntari tineri, pe scenă…” | „Nouă voluntari tineri, pe o scenă, cu diplomele de recunoștință…” — sunt nouă |
| `454507252…-1.jpg` (Voluntar) | „Tineri voluntari cu căști…” | „Opt tineri cu căști portocalii…” — nu se poate spune din poză că sunt voluntari |
| `378583324…-1.jpg` (Presa) | „Un băiat în tricoul alb…, cu brațele ridicate” | „Un copil zâmbitor, în tricoul alb al asociației, cu mâinile la cap…” |
| `347598753…n.jpg` (Casa Teona, Proiecte) | „Mâini la un atelier de pictură: o foaie cu o amprentă…” | „O voluntară pictează cu pensula palma unei fete…; pe masă, foi cu amprente de palme roșii și albastre…” |
| `449496204…-768x1024.jpg` (Donează, Susținere) | „Copii se țin de mână în cerc…” | „O voluntară și patru copii se țin de mână în cerc…; un copil stă ghemuit în mijloc” |
| `438196694…-1.jpg` (Casa Teona, Contact, bandă) | „O voluntară desenează împreună cu un copil, la masă” | „O voluntară stă la masă lângă un băiețel care ține creioane colorate deasupra unui desen” |
| `386090253…n.jpg` (3,5%) | „Copii și voluntari la mesele de sub pergola…” | „Fete și femei la o masă cu prăjituri, sub pergola de lemn a pensiunii, în tabără” |
| `Screenshot_56-1.png` (Voluntar) | „Un voluntar îi arată unei fetițe tricoul primit în tabără” | „Un voluntar ține în fața unei fetițe un tricou negru cu „Keep calm and rock on”; amândoi zâmbesc” |
| `WhatsApp…15.19.17.jpeg` (Realizări, Casa Teona) | „…alături de o voluntară în tricoul asociației” | „…lângă o fată în tricoul asociației” — e un copil, nu o voluntară |
| sigle „Ne susțin” (prima pagină) | `alt="EGGER"` | `alt="Sigla EGGER"` — ca pe pagina Sponsori |
| poze de proiect | „Fotografie din proiectul „X”” ×N | „X — fotografia 3 din 12” |

Verificate și **corecte**, lăsate așa: eroul (3), parcul de aventură, Casa Teona (clădirea, tabla, copăcelul, podeaua interactivă), standul cu brățări, „Vă mulțumim”, „Mulțumim Destine”, „Mulțumim Egger”, voluntarii în uniforme medicale, atelierul de bucătărie, pictura în doi, mingea portocalie, hârtia creponată, cei doi din echipă, cele 4 sigle de presă, Consiliul Județean, ASSIST, EGGER, imaginea Open Graph.

## Rămâne de făcut — și de cine

**Asociația**
- O fotografie reală de la o aniversare de la Casa Teona, pentru blocul „Petreceri” (acum stă acolo atelierul de brățări, cu legenda „La Casa Teona”).
- Decizie privind pozele de la vizitele acasă (cazuri umanitare, cu chipurile copiilor): două rămân în banda de pe prima pagină (`412883312…`, `144023475…`). Caietul cere la cazuri umanitare imagini fără chipuri recognoscibile — recomand scoaterea lor sau un acord scris al familiilor.
- Descrierile proiectelor (două-trei fraze fiecare): până vin, descrierea de căutare e generică („proiect al Asociației…, N fotografii”) și pozele de proiect au doar alt numerotat, nu descriptiv.
- Cont **Google Search Console** pentru `teona-ariana.ro` (probabil există deja pentru WordPress): la lansare, trimiterea `sitemap.xml` și urmărirea erorilor de indexare. Codul de verificare se adaugă în `metadata.verification` din `layout.tsx` dacă e nevoie.

**Dezvoltatorul, la lansare**
- `ADRESA_SITE` în Railway: ștearsă sau `https://teona-ariana.ro` (altfel site-ul rămâne `noindex`). Verificare după lansare: `https://teona-ariana.ro/robots.txt` trebuie să conțină `Allow: /`.
- Trimiterea `sitemap.xml` în Search Console; verificarea că redirecționările 301 din `src/date/redirectionari.ts` răspund pe domeniul final.
- Titlurile paginilor de proiect ies lungi (până la ~130 de caractere cu șablonul); Google le taie, dar le rescrie oricum. Dacă asociația scurtează titlurile proiectelor (sunt titluri de postări Facebook), se rezolvă de la sine.

**Viteză (în afara scopului „doar imagini”, de semnalat)**
- Eroul primei pagini randează toate cele 3 fotografii din slider în DOM; cele două ascunse sunt `loading="lazy"`, dar fiind în viewport se descarcă imediat și concurează cu LCP. Soluție: randarea doar a pozei active și a celei anterioare (schimbare în `Erou.tsx`, dincolo de alt/titluri).
- Trei familii de fonturi (Nunito, Nunito Sans, Kalam), 8 fișiere; Kalam e folosit doar pentru rândurile scrise de mână — de cântărit dacă merită.
- Fotografiile originale sunt mari (până la ~800 KB); optimizarea Next (`/_next/image`) sau Cloudinary le redimensionează, dar `og:image` pentru proiecte trimite fișierul original — acceptabil pentru rețele.
- `public/` mai conține `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` din șablonul Next; de șters (nu sunt în scopul meu).

**Date de verificat cu asociația (neschimbate de mine)**
- Raportul 2025 spune „29 de tabere”, restul site-ului „33” (semnalat deja în `raport-de-activitate-2025/page.tsx`).
- Datele proiectelor sunt datele postărilor din WordPress; câteva (noiembrie 2024) nu sunt datele taberelor. De aceea descrierea de căutare a proiectului nu conține data.

## Verificare

- `npm run build` trece; avertismentul `metadataBase` a dispărut (apărea de 3 ori înainte).
- `npm run lint` tace.
- Server pe portul 3002: `node scripts/verifica-pagini.mjs http://localhost:3002` → „✓ 15 pagină/pagini verificate, nicio problemă”.
- Script propriu peste cele 15 pagini + o pagină de proiect + 404: fiecare are title, description unică, canonical, og:title/url/locale/image, twitter:card/image, JSON-LD, exact un `h1`, nicio săritură de nivel; singurele alt-uri duplicate sunt aceeași poză folosită de două ori pe pagină (de ex. clădirea Casa Teona în antet și în galerie).
- `http://localhost:3002/robots.txt` → `Allow: /`, `Disallow: /api/`, `Sitemap: https://teona-ariana.ro/sitemap.xml`.
- `http://localhost:3002/sitemap.xml` → 46 de adrese.
- Build de probă cu `ADRESA_SITE=https://site-production-641f.up.railway.app`: `robots.txt` → `Disallow: /`, paginile → `noindex, nofollow`, canonical și og:image pe adresa Railway.

Fișiere atinse: `src/app/layout.tsx`, `src/app/page.tsx`, toate `src/app/**/page.tsx`, noi `src/app/seo.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`; componente doar pentru alt: `FasieDeFotografii.tsx`, `NeSustin.tsx`, `Realizari.tsx`, `Sustinere.tsx`. Neatinse: `next.config.ts`, `src/app/api/**`, `src/lib/**`.

---

# Runda a doua — 11 octombrie 2026

Prima rundă a pus temelia (metadate, sitemap, robots, date structurate, texte
alternative). Runda asta pornește de la **ce caută oamenii în Google**, nu de
la ce credem noi, și repară un defect de viteză care se vedea pe toate
paginile.

## Ce se caută, în cifre (România, căutări pe lună)

Date din Ubersuggest, 11 octombrie 2026. Contează pentru că au răsturnat o
presupunere: credeam că pagina de 3,5% trebuie să se cheme „Redirecționează
3,5%”, cum scrie în meniu.

| interogare | căutări/lună | dificultate |
|---|---:|---:|
| **formular 230** | 6.600 | 31 |
| formular 230 anaf 2025 / 2026 | 1.300 / 1.000 | 21 / 25 |
| noul formular 230 editabil | 590 | 15 |
| formular 230 anaf | 720 | 29 |
| formular 230 pdf / editabil / download | 320 / 390 / 260 | 19 / 12 / 24 |
| depunere formular 230 online | 320 | 12 |
| **declarația 177** | 720 | 24 |
| declarația 177 termen depunere 2025 / 2026 | 320 / 170 | 10 / 10 |
| contract sponsorizare declarația 177 | 110 | 8 |
| redirecționare 3,5 din impozit 2025 / 2026 | 170 / 140 | 28 / 21 |
| voluntariat suceava | sub pragul de raportare | — |

Două lucruri reies:

1. **Numele formularului e interogarea**, nu numele mecanismului. „Formular
   230” și variantele lui adună peste 10.000 de căutări pe lună; „redirecționare
   3,5% din impozit” adună 310. La fel, „Declarația 177” bate „direcționează
   20%”.
2. **Intenția e „dă-mi formularul”**: editabil, PDF, de descărcat, completat.
   Asociațiile care prind traficul ăsta îl prind cu un formular precompletat,
   gata de descărcat (în listă apare și o asociație mare, pe exact interogarea
   asta).

## Ce am schimbat

**Titluri, după cifrele de mai sus**

- `/redirectioneaza-3-5`: „Formularul 230 · 3,5% pentru Asociația Teona Ariana”
  (51 de caractere, intră întreg în rezultate).
- `/directioneaza-20`: „Declarația 177 și sponsorizare 20% · Teona Ariana” (49).
- Titlurile din meniu și `h1`-urile de pe pagini **nu s-au schimbat**: acolo
  contează ce înțelege omul care e deja pe site.
- `/doneaza-ti-ziua`: descrierea avea 170 de caractere, se tăia; acum 154.

**Fotografiile, în sitemap (sitemap de imagini)**

`sitemap.xml` declară acum **186 de fotografii**, fiecare pe pagina de proiect
pe care chiar se află, cu adresa fișierului din `public/poze/` (nu cea prin
`/_next/image`, care se naște la prima cerere). Numai paginile de proiect:
pentru ele lista se calculează din aceleași date care randează galeria
(`pozeleProiectului`, mutată în `src/date/proiecte.ts`), deci sitemapul nu
poate promite o poză care nu e pe pagină.

**Date structurate noi**

- `ImageGallery` pe fiecare pagină de proiect, cu fiecare fotografie ca
  `ImageObject` (adresă + descriere). Fără `copyrightHolder`: nu știu cine a
  făcut pozele.
- `openingHoursSpecification` și `hasMap` pe Casa Teona (luni–vineri,
  9:00–17:00, din aceeași sursă ca textul de pe pagină). Fără coordonate — nu
  le-am măsurat.
- `DonateAction` pe asociație, cu ținta pagina Donează.
- `FAQPage` pe Devino voluntar (șase întrebări noi, vezi mai jos).

**Verificarea proprietății, din variabilă de mediu**

`VERIFICARE_GOOGLE` și `VERIFICARE_BING` în Railway → eticheta `meta` apare în
pagină. Lipsă = nu se scrie nimic. Pașii întregi sunt în `LANSARE.md`.

**Paginile subțiri**

Trei pagini aveau sub 250 de cuvinte, cele mai puține din site:

- **Devino voluntar** (244): șase întrebări frecvente, toate cu răspunsul deja
  hotărât în caiet sau în formular (vârsta minimă, experiența, timpul,
  „pot alege unde ajut”, unde se face, ce urmează după trimitere). Nimic
  inventat: despre contract sau certificat de voluntariat nu scrie nicăieri,
  deci nu promit nimic.
- **Sponsori și parteneri** (172): secțiunea „Cum poate firma ta să ne fie
  alături”, cu cele trei căi (contract de sponsorizare, Declarația 177,
  donație directă) și linkuri către paginile care le explică. Fără „beneficii”
  pe care nu le-a promis nimeni.
- **Suntem în presă** (217): blocul „Scrii despre noi?”, cu omul de contact,
  denumirea completă și CIF-ul de copiat (apar greșit în presă destul de des)
  și regula despre fotografii cu copii.

**Contact** (185 de cuvinte) a rămas cum e: o pagină de contact scurtă e
normală, iar umflarea ei cu text ar fi exact genul de conținut pe care nimeni
nu-l citește.

## Saltul paginii (CLS) — defectul care se vedea pe tot site-ul

Măsurat pe build-ul de producție, cu procesorul încetinit de patru ori (cât un
telefon de mijloc):

| pagină | CLS înainte | CLS acum |
|---|---:|---:|
| prima pagină, 1280 px | 0,160 | 0,018 |
| prima pagină, 390 px | 0,205 | 0,040 |
| Casa Teona, 1280 px | 0,159 | 0,000 |
| Casa Teona, 390 px | 0,151 | 0,000 |

Google numără „bun” sub 0,1, iar CLS e unul dintre cele trei semnale Core Web
Vitals care intră în clasare. Cauzele, amândouă în `layout.tsx`:

1. **Antetul stătea într-un `<Suspense>` fără `fallback`.** Antetul citește
   calea paginii curente, deci trebuie să fie într-un `<Suspense>`; fără
   `fallback`, primul HTML n-avea nimic în locul lui. Pagina se desena cu
   conținutul lipit de sus, iar după ~1,3 secunde antetul apărea și împingea
   totul în jos cu 68–167 px. Acum locul e ținut de un bloc de aceeași
   înălțime (`LocAntet`).
2. **Bara de anunț nu se scria pe server.** Starea „închisă” stă în
   `sessionStorage`, pe care serverul nu-l vede, așa că bara apărea abia după
   ce pornea JavaScriptul: încă 45 px (70 pe telefon), pentru toată lumea, la
   fiecare pagină. Acum bara se scrie pe server, iar cine a închis-o n-o vede
   totuși: două rânduri de script în `<head>` citesc `sessionStorage`
   **înainte de prima desenare** și pun o clasă pe `<html>`, pe care CSS-ul o
   folosește ca s-o ascundă. Verificat: fără clipire, fără salt, bara revine
   la o vizită nouă, zero erori în consolă.

Restul măsurătorilor, pe aceeași încetinire: LCP între 464 și 860 ms (pragul
„bun” e 2.500 ms), TTFB sub 35 ms, pagini de 0,32–0,57 MB, nicio imagine peste
200 KB.

**Probă nouă**: `scripts/qa/salt-layout.mjs` măsoară CLS pe patru pagini × două
lățimi și pică peste 0,08. Se rulează pe build-ul de producție:

```bash
npm run build && PORT=3101 npm run start &
BAZA_PROD=http://localhost:3101 node scripts/qa/salt-layout.mjs
```

De asemenea, `scripts/qa/cont.mjs` nu mai raportează nouă verificări picate
când serverul de probă n-are cheie de e-mail (contul donatorului e oprit din
construcție atunci): iese cu 2, „sărit”, ca la lipsa bazei de date.

## Ce rămâne — și cine o poate face

**Asociația, în ordinea câștigului**

1. **Formularul 230 precompletat, de descărcat** (PDF editabil). E cea mai mare
   ușă de intrare din tot site-ul: peste 10.000 de căutări pe lună, iar
   intenția e fix „dă-mi formularul”. Pagina are deja locul pregătit — cardul
   „Formularul 230” de la „Documente de descărcat” devine buton în clipa în
   care fișierul există. Fără el, pagina răspunde la întrebare, dar nu dă
   lucrul căutat.
2. **Declarația 177 și contractul de sponsorizare**, la fel, pentru firme
   („contract sponsorizare declarația 177”: 110 căutări pe lună, dificultate 8
   — practic liber).
3. **Fișa Google Business Profile** pentru Casa Teona (Strada Zamca 22). Pentru
   „ong suceava” și pentru harta din dreapta rezultatelor contează fișa, nu
   site-ul. Pașii sunt în `LANSARE.md`.
4. **Descrierile proiectelor.** 31 de pagini de proiect au acum titlu, dată și
   poze, dar niciun text. Pozele sunt declarate pentru Google Imagini, deci
   paginile nu sunt goale — dar două-trei fraze pe fiecare le-ar face să
   răspundă și la căutări scrise.
5. **Linkuri de la publicațiile locale.** Articolele din „Suntem în presă”
   există; dacă în ele ar fi și un link către site, ar conta mult mai mult
   decât orice schimbare de titlu.

**Dezvoltatorul, la lansare**: pașii din `LANSARE.md`, secțiunea 1.

**De cântărit mai târziu**

- Numele fișierelor de poze sunt cele din Facebook
  (`462119250_122094741458569469_…jpg`). Google Imagini se uită mai ales la
  textul alternativ și la pagina din jur, dar un nume de fișier descriptiv
  ajută. Redenumirea celor 389 de fișiere ar rupe maparea din `continut/`;
  merită doar odată cu un CMS.
- Cele șase articole vechi de blog redirecționează acum către pagini. O
  secțiune de noutăți ar da conținut proaspăt, dar fără un CMS fiecare articol
  trece prin dezvoltator (vezi „Decizii încă deschise” din `CLAUDE.md`).

---

# Runda a treia — 11 octombrie 2026, seara: motoarele care răspund, nu listează

Tot mai mulți oameni nu mai primesc o listă de linkuri, ci un răspuns: ChatGPT,
Perplexity, rezumatele AI din Google, Copilot. Pentru o asociație, asta schimbă
miza. Un răspuns care spune „poți dona la Asociația Teona Ariana în contul
RO16 RNCB 0234 1852 3366 0001” ajută; unul care inventează un IBAN sau un
număr de telefon face pagubă reală, iar omul nici nu află că a fost greșit.

## `/llms.txt`

Fișier nou, la `https://www.teona-ariana.ro/llms.txt`, generat din aceleași date ca restul
site-ului (`src/app/llms.txt/route.ts`). Convenția e de la llmstxt.org: un
Markdown scris pentru un model care caută un răspuns, nu pentru un om care
răsfoiește. Conține:

- datele de identificare (denumire, CIF, cele două adrese, telefoane, e-mail,
  program, rețele);
- ce face asociația și cele patru cifre publicate;
- cele cinci căi de a ajuta, cu conturile bancare, SMS-ul, mecanica
  Formularului 230 și a Declarației 177;
- harta paginilor, fiecare cu o frază despre ce conține (nu descrierea pentru
  Google — aia e scrisă ca să convingă un om să dea clic);
- o secțiune **„Ce nu se știe — vă rugăm să nu completați”**: costuri, câți
  copii ajută o sumă, anul înființării, bugetul, numărul de angajați, numele și
  diagnosticele copiilor. Exact golurile pe care un model le-ar umple singur.

**Cinstit despre ce e:** nu e un standard adoptat. Google a spus explicit că
nu-l folosește; OpenAI și Anthropic nu l-au anunțat ca sursă. Nu înlocuiește
nimic — se scrie singur, nu costă întreținere, și dacă se adoptă, e deja acolo.

## Roboții AI, în `robots.txt`

Grup separat, explicit, pentru GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended,
Applebot-Extended, meta-externalagent și CCBot. Toți au voie peste tot în afară
de `/api/`, `/admin/` și `/ziua-ta/`.

Grupul nu schimbă nimic funcțional — regula `*` le permitea deja tot. Există
pentru că e răspunsul scris la întrebarea „are voie ChatGPT pe site?” și pentru
că, dacă asociația vrea vreodată să oprească antrenarea, se schimbă un singur
cuvânt. Atenție la mecanică: un robot care-și găsește numele într-un grup
propriu **nu mai citește** grupul `*`, de aceea interdicțiile sunt repetate.

Decizia e „au voie”, pentru că scopul e ca asociația să fie găsită. Prețul e că
aceleași modele se antrenează pe text și pe fotografii, inclusiv pe fotografii
cu copii. E o decizie a asociației, nu una tehnică — dacă răspunsul e altul, se
schimbă pe un rând.

## Ce contează de fapt pentru un răspuns AI (și e deja făcut)

Un model citează ce poate extrage fără efort și ce nu se contrazice:

1. **Întrebări cu răspuns direct**, cu date structurate `FAQPage` — pe Donează,
   3,5%, 20%, Donează-ți ziua și Devino voluntar. Astea sunt materia primă a
   răspunsurilor AI.
2. **Date structurate despre organizație** — `NGO` cu CIF, adrese, telefoane,
   program, conturi de social media, pe fiecare pagină.
3. **HTML curat, fără text ascuns în imagini** — toate cifrele și adresele sunt
   text.
4. **Aceeași cifră peste tot** — toate vin din `src/date/asociatie.ts`.

## Singurul lucru care strică răspunsurile și nu e în mâna noastră

**Raportul de activitate 2025 spune „29 de tabere”; restul site-ului spune
„33”.** Pentru un om e o scăpare; pentru un model e o contradicție în aceeași
sursă, și atunci ori alege greșit, ori ocolește. E semnalat din prima rundă și
în comentariul din `raport-de-activitate-2025/page.tsx`. Doar asociația poate
spune care e corectă — noi n-avem voie să ghicim.

## Probă nouă

`scripts/qa/llms-txt.mjs` nu verifică fișierul în sine, ci **îl compară cu ce
văd oamenii pe pagini**: ia IBAN-urile de pe Donează, telefoanele și CIF-ul de
pe Contact și cere să fie aceleași în `llms.txt`; verifică apoi că fiecare link
din fișier răspunde cu 200 și că grupul AI din `robots.txt` repetă
interdicțiile. Dacă cineva scrie vreodată ceva de mână în fișier și rămâne în
urmă, proba pică.

---

# Fotografiile — 14 octombrie 2026

Clientul a semnalat că „pozele arată nașpa, la Casa Teona se văd numai
picioarele". Verificat pe toate cele **73 de fotografii** folosite pe site, cu
planșe de contact care arată fiecare poză exact cum e tăiată în pagină.

## Ce era de fapt

Nu pozele. **Tăietura.** Toate stau în cutii cu raport fix, tăiate cu
`object-fit: cover` din centru. O poză făcută cu telefonul ținut vertical,
pusă într-o cutie lată, pierde banda de sus — adică fețele.

Măsurat: **29 de fotografii pierd peste un sfert din cadru**, unele 58%, toate
tăiate din mijloc. Poza semnalată de client (băiatul de pe podeaua interactivă
de la Casa Teona) pierdea 44%: rămâneau steaua proiectată și două picioare. La
alta, o fetiță care sărută un băiețel pe obraz, rămâneau covorul și bețișoarele.

**Reparat** la patru fotografii, acolo unde ridicarea tăieturii chiar schimbă
ce se vede: podeaua interactivă, fetele la masa de lucru, fetița cu mingea
portocalie, masa de atelier văzută de sus. Tăietura stă în `src/date/taieturi.ts`,
legată de fișier, nu de locul unde e pusă poza — aceeași poză apare pe două-trei
pagini, în cutii de forme diferite, iar subiectul e în același loc peste tot.
Restul celor 29 au fost comparate una câte una, în varianta de acum și în cea
ridicată; la ele centrul e mai bun și au rămas neatinse.

Probă nouă: `scripts/qa/taieturi.mjs` desenează fiecare poză portret dintr-o
cutie lată, acum și ridicată, una lângă alta.

## Poze de stoc în arhivă — nefolosite, dar acolo

Patru fișiere din `public/poze/` sunt poze de stoc rămase de la tema WordPress:

- `happy-girl-with-down-syndrome-posing-while-drawing-scaled.webp`
- `portrait-beautiful-girl-have-fun-park-scaled.webp`
- `diverse-people-refugee-camps-1-scaled.webp`
- `boy-with-scissors-removebg-preview.png`

**Niciuna nu e folosită pe site-ul nou** — verificat. Site-ul arată numai copii
și voluntari reali, ceea ce pentru o asociație nu e un amănunt: o poză de stoc
cu „happy girl with Down syndrome" în locul copiilor pe care chiar îi ajuți e
genul de lucru care se observă.

Nu le-am șters: sunt trecute în `continut/media.json` și `continut/pagini.json`,
arhiva site-ului vechi, iar ștergerea ar strica fidelitatea arhivei. Dacă
cineva alege poze de acolo, astea patru sunt de ocolit.

## Ce rămâne de hotărât

**Pagina Proiecte e un zid cu aceeași poză.** Douăzeci din cele 31 de proiecte
au drept copertă o fotografie de grup în tricouri albe, în fața aceleiași
pensiuni. Fiecare e reală și e a proiectului ei, dar puse una lângă alta nu se
deosebesc. Coperta se alege acum automat — prima poză a proiectului. S-ar putea
alege alta (a doua, a treia), dar fără să mă uit la fiecare galerie n-am de
unde să știu care e mai bună. Dacă asociația trimite, pentru proiectele
importante, care poză să fie coperta, se rezolvă în câteva minute.

**Pozele din 2025 și 2026 sunt în Cloudinary**, în două foldere. Sesiunea asta
n-are cheile (sunt în Railway, și acolo e locul lor). Cu ele, pozele noi pot
intra în galeriile proiectelor din 2026 și pot înlocui câteva dintre cele
vechi, de rezoluție mică.
