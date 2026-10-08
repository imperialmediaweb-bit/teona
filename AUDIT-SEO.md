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
