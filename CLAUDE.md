# Site nou pentru Asociația Teona Ariana Suceava

Înlocuiește `teona-ariana.ro`, care e acum WordPress cu tema Risehand și Elementor.
Next.js 16 + TypeScript + Tailwind 4, găzduit pe Railway.

Site-ul vechi rămâne în funcțiune până la lansare. **Nu-l opri.**

## Ce e deja aici

| cale | ce conține |
|---|---|
| `continut/pagini.json` | 35 de pagini publicate: titlu, slug, adresa veche, textele din Elementor în ordine, pozele folosite |
| `continut/proiecte.json` | 31 de proiecte, cu cele 168 de poze deja repartizate pe fiecare |
| `continut/echipa.json` | 6 membri |
| `continut/articole.json` | 6 articole de blog, cu HTML și text curat |
| `continut/media.json` | toate cele 389 de fișiere media, cu textul alternativ |
| `continut/caiet-de-sarcini.txt` | **specificația clientului, 23 de pagini** — de aici se lucrează |
| `public/poze/<an>/<luna>/` | fișierele descărcate, 62 MB, aceeași structură ca în WordPress |
| `scripts/export-wordpress.xml` | exportul complet, curățat de date personale |
| `src/lib/continut.ts` | citirea conținutului, cu tipuri; `pozaLocala()` traduce adresele vechi |

`src/app/page.tsx` e o pagină de inventar provizorie. Nu e design — doar dovada că
totul se citește. Se înlocuiește cu prima pagină adevărată.

## Reguli pentru conținut

**Nu inventa cifre și nu afirma lucruri pe care nu le știi.** E site-ul unei asociații
de copii cu dizabilități; o cifră greșită îi costă credibilitatea. Dacă un text cere
o informație pe care n-o ai (cât costă o zi de tabără, câți copii au fost într-o
tabără anume), las-o în alb și întreabă — nu o completa „ca să sune bine".

**Widgeturile de temă vin cu texte implicite.** Pe site-ul vechi, o secțiune pusă în
grabă a afișat „Sorem ipsum dolor sit amet…" pe prima pagină, pentru că un câmp n-a
fost completat și tema a folosit valoarea din fabrică. Verifică fiecare câmp al unei
componente înainte s-o publici, nu doar pe cele la care te-ai gândit.

## Cum scrie asociația: frazele lor sunt șablonul

Textele site-ului se scriu din trei locuri — eu, ei (din panou) și modelul care
face prima ciornă. Trei mâini, trei registre, și al meu e cel mai lung și cel
mai explicativ: îmi vine să scriu *de ce* funcționează ceva într-un fel, când
omul voia să afle ce are de făcut.

Singurul eșantion adevărat al vocii lor sunt **două fraze scrise de ei**, în
documentul din 16 octombrie 2026. Stau în `src/lib/ton-asociatie.ts`, cuvânt cu
cuvânt, cu regulile citite din ele (fiecare regulă poartă bucata din care s-a
citit, ca să se poată verifica):

- vorbește cu omul, cu „tu" — **afară de firme**, cărora li se scrie cu
  „dumneavoastră": paginile de sponsorizare sunt o scrisoare de afaceri, iar
  amândouă frazele lor sunt scrise către un om;
- începe de la el, nu de la noi; propoziții scurte, una după alta; spune ce
  face el, cu verbe; numește lucrurile pe nume (fraza lor despre tot ce face
  asociația n-are nici un adjectiv);
- **nu explica de ce merge așa** — greșeala mea, nu a lor;
- dacă e simplu, spune că e simplu. Fără semne de exclamare.

Se scrie **o dată, pentru toate căile**: blocul pleacă spre model din
`asistent.ts` (ciorna din panou) și se vede ca „Cum scriem" lângă câmp, la
`/admin/scrie` și `/admin/sabloane`. Dacă ar fi scris de două ori, una din
copii s-ar strica fără să observe nimeni — ca la `analiza/ton.ts`.

**Prozele lungi din paginile principale sunt ale lor, nu ale mele.** Textele de
pe „Despre noi", „Casa Teona", „Donează", „Devino voluntar" vin din caietul de
sarcini sau din site-ul vechi. Nu se rescriu, nici „ca să sune mai bine". Ce e
al meu e legătura dintre ele: întrebările frecvente, notițele de sub câmpuri,
textele de stare. Alea se îndreaptă după frazele lor.

Proba — fără chei adevărate, fără internet, fără bază de date; verifică la
nivel de rețea că frazele lor pleacă întregi, că perechea „așa nu / așa da" e
acolo, că sunt cifrele verificate și că **niciun șablon `${…}` necompletat** nu
ajunge la model (un rând scris între ghilimele drepte în loc de accente grave
nu se interpolează niciodată și nu dă nicio eroare — aceeași greșeală ca
„Sorem ipsum"):
`PAROLA_ADMIN=… node scripts/qa/ton-asociatie.mjs` (cere un `npm run build`
făcut înainte: pornește singură un al doilea site, pe alt port).

## Cifrele se schimbă din panou, nu din cod

Caietul le cere la pagina 1, printre regulile valabile pe tot site-ul:
„Cifrele sunt aceleași peste tot […] **Asociația le poate modifica singură.**"
Până acum a 34-a tabără însemna un mesaj către mine și o publicare.

`/admin/cifre` ține cele patru rânduri: cifra, sufixul („+" la 1.500+, gol la
33) și eticheta, care se poate schimba și ea. **Patru, nici mai multe, nici mai
puține** — banda e desenată pentru patru și pe telefon se așază două pe două.

`src/lib/cifre.ts` le citește, cu `CIFRE` din `date/asociatie.ts` ca
**rezervă**, nu cu o listă goală: o bandă fără nimic pe prima pagină spune
despre asociație că n-a făcut nimic. Se schimbă într-un loc și se schimbă peste
tot — prima pagină, Despre noi, pagina de 3,5%, `llms.txt`, asistentul de pe
site, ciorna scrisă de model și șablonul de e-mail de campanie.

- **Tipul `Cifra` stă în `date/asociatie.ts`, nu în `lib/cifre.ts`.** Îl
  folosește și `componente/Cifre.tsx`, care rulează în browser (contoarele se
  animă), iar un import din `lib/cifre.ts` trage după el `lib/baza.ts` și
  driverul de Postgres în pachetul trimis browserului: build-ul cade cu
  „module not found: pg". **Verificarea de tipuri nu prinde asta** — a prins-o
  build-ul.
- **Ciorna scrisă de model primește cifrele din panou.** Instrucțiunile îi
  spun „astea sunt singurele cifre pe care le poți folosi"; lăsate în cod, ar
  fi scris cuminte 33 după ce asociația a trecut la 34, iar greșeala ar fi avut
  în pagină exact aerul unei cifre verificate.
- Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/cifre.mjs` — schimbă o cifră
  prin panou, o caută pe cele patru suprafețe publice, verifică că „7.777"
  scris cu punct de mii nu devine 7 și că un text în locul cifrei e refuzat,
  apoi pune cifrele înapoi cum erau.

## Documentele de descărcat se înlocuiesc din panou

Caietul o cere în două locuri: la **2.4**, pentru contractul de sponsorizare și
Declarația 177 — „Asociația poate înlocui singură cele două fișiere când se
actualizează modelele" — și la **7.5**, pentru cele trei documente de la pagina
de 3,5%, adăugând că „fără ele, butoanele de descărcare rămân **inactive** la
lansare".

`/admin/documente` ține cele cinci. Lista e fixă (`src/lib/documente.ts`):
fiecare rând e legat de un buton anume, de pe o pagină anume. Un document urcat
fără un buton care să ducă la el ar sta în depozit nevăzut, iar cine l-a urcat
ar crede că l-a publicat.

- **Adresa publică nu se schimbă niciodată:** `/documente/<slug>`. Deci un link
  pus într-un e-mail acum trei luni duce la modelul de acum.
- **Trei trepte, în ordinea asta:** fișierul urcat din panou (din R2) · fișierul
  din depozitul de cod, pentru documentele care au unul (`rezerva`) · o pagină
  404 care spune pe față că fișierul nu e pe site, cu telefon și e-mail. Cele
  două contracte au rezervă, deci **se descarcă și cu R2 neconfigurat** — ce
  funcționează azi trebuie să funcționeze și mâine.
- **Butonul e inactiv cât timp fișierul nu există**, cum cere caietul.
  `documenteGata()` (`src/lib/documente-gata.ts`) verifică ce e acolo cerând
  **un singur octet** (`Range: bytes=0-0`): un GET întreg ar descărca zece
  megaocteți de contract la fiecare randare. Verificarea stă în alt fișier
  decât lista, ca lista să rămână date curate — aceeași lecție ca la tipul
  `Cifra`.
- **Ruta de urcare nu crede slugul pe cuvânt:** îl caută în lista fixă și ia
  cheia din R2 de acolo. Altfel cineva ar putea scrie orice cale în formular și
  ar scrie peste orice fișier din depozit. Se verifică și **primii patru
  octeți** (`%PDF`), nu extensia: un Word redenumit în `.pdf` ajunge la firmă
  și nu se deschide, iar firma crede că e vina ei.
- Formularul 230 se urcă **și** de la `/admin/formulare`, lângă formularele
  primite, cu aceeași cheie din R2. Două locuri, un singur fișier.
- Probă, fără chei de R2: `BAZA=… PAROLA_ADMIN=… node scripts/qa/documente.mjs`
  — 23 de verificări: rezerva din depozit merge, ce nu există răspunde 404 cu
  pagină omenească, un slug din afara listei nu urcă nimic, un fișier care nu
  începe cu `%PDF` e refuzat.

## Siglele sponsorilor se adaugă din panou

Întrebarea e a asociației, din octombrie 2026: „La Sponsori o să pot și eu
adăuga ulterior sigle? Ei sunt mai mulți decât apar acum pe site." Caietul cere
la 6.3 să se adauge „și alte sigle ale sponsorilor care au mai apărut pe parcurs
(de trimis de la asociație)" — adică, până atunci, trimise mie.

`/admin/sponsori`: adaugă, redenumește, pune adresa firmei, scoate de pe site,
mută cu ↑ și ↓. Sigla urcată merge în Cloudinary, în subdosarul `sigle`, și se
scrie `/cloud/<identificator>` — convenția care există deja pentru pozele din
panou, deci `next/image` o redimensionează ca pe oricare alta.

- **Numele firmei e obligatoriu**, și regula e de dinainte: fără el, textul
  alternativ ar fi „siglă de sponsor", care nu spune nimic cui ascultă pagina,
  iar sub siglă n-ar scrie nimic.
- **Pe prima pagină intră primele douăsprezece** (`PE_PRIMA_PAGINA`, scris o
  dată în `date/sponsori.ts` — a treisprezecea rupe rândul). Panoul scrie pe
  fiecare rând dacă se vede și pe prima pagină, altfel nimeni n-ar înțelege de
  ce o siglă nouă nu apare acolo.
- **↑ și ↓ mută între siglele la fel de vizibile, nu peste cele ascunse.**
  Prima variantă schimba locul cu vecinul din lista întreagă: dacă vecinul era
  o siglă scoasă de pe site, schimbul se făcea în baza de date și pe site nu se
  vedea nimic. Omul apăsa o dată, nu se mișca nimic, și conchidea că butonul e
  stricat. **Proba a prins-o**, nu citirea codului.
- **Nimic nu se șterge, se scoate de pe site.** Un sponsor de anul trecut
  rămâne un sponsor de anul trecut, iar dacă revine, sigla lui e tot acolo.
- Rezerva sunt cele 30 de sigle din `date/sponsori.ts`: o bandă „Ne susțin"
  goală pe prima pagină spune despre asociație că n-are sponsori.
- Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/sponsori.mjs` — 20 de
  verificări. Ea **golește întâi cache-ul**, apoi citește banda: cache-ul cu
  etichetă al lui Next trăiește în `.next/cache` și **trece peste reporniri**,
  deci fără pasul ăsta proba compara banda de la o rulare de dinainte cu baza
  de date de acum și arăta trei defecțiuni care nu existau.

## Textele paginilor fixe se scriu din panou

Ultimul lucru care trecea neapărat prin mine. Despre noi, Casa Teona, Donează
— textul stătea în cod, deci o virgulă schimbată însemna un mesaj către mine și
o publicare.

`/admin/texte` ține **18 bucăți de text**, grupate pe pagini: fraza de pe prima
pagină, cele trei blocuri din „Povestea noastră", misiunea, viziunea,
Culegătorii de Zâmbete, cele trei blocuri de la Casa Teona, frazele din capul
fiecărei pagini și textul „De ce Asociația Teona Ariana".

- **Nimic nu se șterge.** Textul de acum rămâne scris în `src/lib/texte-pagini.ts`,
  în `implicit`, pentru totdeauna. O schimbare din panou e un **rând nou** în
  tabelul `texte_pagini`; „Pune textul de la început" șterge rândul ăla, nu
  textul, iar ce scria la lansare se întoarce întreg. De aceea tabelul **nu se
  seamănă**: lipsa unui rând înseamnă „n-a schimbat nimeni nimic aici".
- **Se schimbă ce scrie, nu cum arată.** Titlurile de secțiuni, fotografiile,
  butoanele și așezarea rămân în cod. Rând gol = paragraf nou; atât.
- **Cifrele din proză se completează singure.** Textul de la 3,5% avea „33 de
  tabere, cu peste 1.500 de participanți" scrise de mână — se învecheau în ziua
  în care asociația trecea la a 34-a tabără, fără să observe nimeni, exact
  împotriva regulii din caiet („aceleași peste tot […] preluate automat din
  aceleași date"). Acum se scrie `{tabere}`, `{participanti}`, `{copii}`,
  `{voluntari}`. **Ce nu e în lista aia rămâne scris cum e** — un `{tabre}`
  greșit se vede pe pagină, iar panoul îl semnalează în roșu înainte de
  salvare. Un loc care dispare în liniște e felul în care o frază ajunge pe
  site fără jumătate din ea.
- Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/texte-pagini.mjs` — 23 de
  verificări, din care cea mai importantă e că „Pune textul de la început"
  readuce textul întreg.

### Cât ține cache-ul a ce se scrie din panou

`src/lib/cache-panou.ts`, folosit de cifre, texte, sponsori, testimoniale și
documente: **stale 60s, revalidare 300s, expirare o zi** — scrise ca numere, nu
ca nume de profil.

Cazul obișnuit îl rezolvă eticheta: o salvare din panou golește cache-ul și
schimbarea se vede pe loc. Numerele astea acoperă numai cazul celălalt, care nu
se vede la citit codul: **Railway construiește fără acces la baza de date**,
deci la build în cache intră rezerva din cod. Cu profilul `"hours"`, site-ul
arăta o oră întreagă după fiecare publicare cifrele și textele de la lansare,
nu pe ale asociației — omul schimba o cifră luni, eu publicam marți, iar cifra
lui dispărea pentru o oră. Fereastra a fost scurtată la cinci minute, și tot
s-a văzut: clientul a numărat 30 de sigle în loc de 54 chiar după o
publicare. Acum **rezerva nu se ține**: ramura care întoarce rezerva cheamă
și `cacheRezerva()` (reîmprospătare la 10 secunde; `expire` rămâne 300, sub
atât Next o socotește dinamică și build-ul cade), iar Next ia minimul dintre
apelurile `cacheLife` din aceeași funcție. Deci cel mult primul vizitator de
după publicare mai vede rezerva; cererea lui o reîmprospătează. **Golirea se face cu `{ expire: 0 }`, nu cu `"max"`**: `revalidateTag(…, "max")`
servește încă o dată varianta veche. Proba din 11 noiembrie 2026 a prins-o la
texte: după „Salvează” pagina publică arăta textul vechi, iar după „Textul de
la început” arăta încă textul de probă — site-ul rămânea cu un pas în urmă
față de panou. Același defect fusese reparat la tabere; acum e peste tot.
**Probele care citesc o pagină publică
după o salvare trebuie să aștepte**, sau să golească întâi eticheta cu o
salvare care nu schimbă nimic.

## Testimonialele: citat scurt, scrisoarea întreagă dedesubt

Caietul cere la 1.8 citate de 20–35 de cuvinte, și bine cere: un paragraf lung
într-un carusel nu se citește, se sare. Dar ce trimite o familie după o tabără
vine întreg, iar tăiat la o frază se pierde tocmai partea pentru care cineva
stă pe pagină.

Deci la `/admin/testimoniale` sunt două câmpuri: **citatul**, scurt, cel care
se vede, și **textul întreg**, care se deschide sub el la „Citește tot".
Rând gol = paragraf nou. Gol, nu apare niciun buton.

- **Coloana se adaugă separat, cu `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.**
  Tabelul e făcut cu `CREATE TABLE IF NOT EXISTS`, iar ăla nu se uită la
  coloane: pe baza de pe Railway, unde tabelul exista deja, instrucțiunea trece
  tăcut și coloana n-ar apărea niciodată — iar prima citire care o cere ar
  răspunde „column «text_lung» does not exist", deci **prima pagină** ar da
  500, nu doar panoul. Aceeași lecție ca la tabelul `contracte`.
- **Comentariul din blocul de SQL n-are accente grave.** Blocul e un template
  literal; un accent grav îl încheie în mijlocul schemei. Verificarea de tipuri
  o prinde, dar abia după ce o cauți.
- **Un text prea lung e refuzat, nu tăiat.** `text()` din `lib/api.ts` întoarce
  `null` și când textul depășește limita, nu doar când lipsește. Scris ca
  `text(...) ?? null`, o scrisoare de 7000 de semne s-ar fi salvat ca „niciun
  text lung": omul apasă Salvează, primește „Schimbat", și ce a lipit nu e
  nicăieri. Limita e 6000 de semne; peste atât e o noutate, nu un testimonial.
- **Deschis se ține pe carusel, nu pe testimonial.** Lăsat pornit la mutare,
  următorul s-ar deschide singur, cu un buton pe care scrie „Închide" fără ca
  omul să fi apăsat nimic.
- Probă: `BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/testimoniale.mjs`
  — 15 verificări. Își face singură testimonialul de probă și îl șterge la
  final: unul rămas în tabel ar ajunge pe prima pagină, între cuvintele unor
  oameni adevărați.

## Date reale, verificate (nu le reinventa)

- Denumire: **Asociația Teona Ariana Suceava**, CIF **43533953**
- Telefoane: **0754 510 167**, **0748 250 704** · e-mail **contact@teona-ariana.ro**
- Casa Teona: Strada Zamca 22, Suceava, 720215 · sediu social: Strada Nicolae Milescu 7
- Conturi: BCR RON `RO16 RNCB 0234 1852 3366 0001` · UniCredit RON `RO57 BACX 0000 0021 0940 3001` · UniCredit EUR `RO30 BACX 0000 0021 0940 3002`
- SMS: **SUSTIN la 8835**, 5 € lunar; oprire cu `SUSTIN STOP` (gratuit)
- Galantom: `https://ata-suceava.galantom.ro/` · pagina de ziua ta:
  `https://dar.galantom.ro/fundraising_pages/create?id_project=2457`
- Cifre: **33** tabere organizate · **1.500+** participanți · **80+** copii la Casa Teona · **300+** voluntari
- Rețele: facebook.com/asociatia.teona.ariana · instagram.com/teonaariana_sv · tiktok.com/@teonaarianasv
- Motto: „Nimic fără Dumnezeu"
- Din contractul de sponsorizare (`continut/contract-sponsorizare-2026.pdf`,
  primit pe 14 octombrie 2026): înscrisă în registrul persoanelor juridice cu
  **nr. 1/14.01.2021** · reprezentant legal **Corneliu Cristea Costiuc,
  Președinte** · conturile UniCredit sunt la **Suc. Curtea Domnească Suceava**,
  cel BCR la **BCR Suceava** · pe antetul lor apare și adresa
  **ata.suceava@gmail.com**

## Date personale — ce NU intră aici

Exportul a fost curățat înainte de primul commit: s-au scos **13 donații** (cu nume,
e-mail și sumă), **293 de comentarii** și conturile de utilizator.

Donatorii merg într-o bază de date separată, nu în depozit. Pentru campanii de e-mail
e nevoie de acord explicit, bifat separat de donație — donatorii existenți **nu au**
un astfel de acord înregistrat, deci nu pot fi adăugați retroactiv pe o listă de
buletine informative.

## Pozele taberelor: legătura se face pe dată

Asociația urcă pozele în Cloudinary, în foldere cu numele scris de mână:
`Teona/2025/TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025`. Site-ul **nu** ține lista
fișierelor; `src/date/proiecte-cloud.ts` citește zilele și luna din numele
folderului și le potrivește cu data proiectului.

Ce înseamnă asta în practică:

- o tabără nouă apare pe site **fără modificări de cod** — e destul ca pozele
  să fie urcate într-un folder cu data în nume, iar proiectul să existe cu
  aceeași dată;
- dacă nimic nu se potrivește, sau dacă două foldere ies la egalitate, nu se
  alege niciunul: mai bine o galerie goală decât pozele altei tabere, cu alți
  copii, pe pagina greșită;
- două foldere din 2026 n-au nicio dată în nume („TABĂRĂ ONCOLOGIE 2026”,
  „TABĂRĂ PERFORMANȚA 2026”), deci proiectele lor scriu numele folderului
  explicit, prin `dosarCloud`;
- contul e pe „dynamic folders”: folderul e un câmp separat de identificatorul
  pozei, deci listarea se face cu `resources/by_asset_folder`, nu cu `prefix`.
  Căutarea pe identificator rămâne ca rezervă, pentru conturile în modul vechi.
  **Identificatorul n-are nicio legătură cu folderul**, deci o poză de tabără
  se cheamă `M_ue0nhw`, nu `Teona/2025/…`: după calea folderului nu se poate
  căuta în pagina randată, iar o galerie care merge arată, din afară, exact
  ca una goală;
- **ce nu e fotografie nu intră în galerie.** `by_asset_folder` întoarce tot
  ce e în folder. În folderele taberelor au ajuns fișiere
  `New_Text_Document_….txt`, urcate din greșeală odată cu pozele: veneau cu
  `resource_type: "raw"`, treceau ca orice poză și, fiindcă lista se sortează
  cu cea mai nouă prima, nimereau tocmai pe locul mare din capul galeriei — un
  dreptunghi gol. Asta a fost „eroarea la poze” semnalată în octombrie 2026 la
  taberele de autism din septembrie 2025. Se cer amândouă condițiile, tipul și
  o lățime peste zero: un fișier fără dimensiuni nu e o fotografie pe care s-o
  poți așeza în pagină, oricum ar fi etichetat. Cernerea se face **înainte** de
  a hotărî dacă prima cerere a adus ceva, altfel un folder plin numai cu
  fișiere text ar părea plin și rezerva n-ar mai fi încercată;
- în panou, la `/admin/poze`, se vede sub fiecare folder la ce proiect au
  ajuns pozele lui, sau că n-a ajuns la niciunul;
- taberele mari au pozele pe subfoldere („ZIUA 1”, „GRUP”); se citesc două
  niveluri în adâncime;
- proba `node scripts/qa/poze-cloud.mjs` verifică potrivirea fără cheile
  adevărate, cu un server care imită Cloudinary.

## Pozele de galerie se urcă din panou, nu din Cloudinary

Contul de Cloudinary e al dezvoltatorului; **asociația n-are cont acolo**.
Până pe 10 noiembrie 2026 galeria unei tabere se putea doar *alege* dintr-un
folder făcut în Cloudinary, deci o tabără nouă cerea tot un mesaj către mine.
Asociația a scris: „la poze nu am nicăieri un buton adaugă”.

Acum, în ciorna oricărui text (tabără, noutate, campanie), „Pozele …, pentru
galerie” (`componente/admin/UrcaPozeTabara.tsx`): se scrie numele folderului,
se aleg pozele, „Urcă pozele”. Folderul se face singur,
`Teona/<an>/<NUME>`, și se leagă de text de la prima poză.

- **O poză pe cerere** (`/api/admin/poze-tabara`): o sută de poze deodată
  trec de limita de 30 MB și de răbdarea proxy-ului Railway. Fiecare se
  micșorează în browser chiar înainte de trimitere (`micsoreaza`, exportat din
  `MicsoreazaPoza`); câmpul are `data-fara-micsorare`, ca cele două să nu
  lucreze deodată.
- **Legătura se scrie în baza de date la prima poză** și, în pagină, în câmpul
  `dosarCloud` al formularului. Altfel „Salvează ciorna” trimitea valoarea
  veche din listă și ștergea legătura. Din același motiv, folderul ales
  rămâne în listă chiar dacă lista (în cache un minut) încă nu-l are.
- Noutățile și campaniile au acum galerie, sub text (`pozeDinDosarScris`).
- Galeriile au eticheta `poze-cloud`; urcarea o golește, deci pozele apar fără
  să aștepte ora de cache.
- **Poza principală nu ține locul galeriei.** Pe 11 noiembrie 2026 asociația
  a publicat „Tabăra Eu pot” cu poza principală și 34 de poze în folderul ei;
  pe site apărea doar poza principală, fiindcă `cuPozeDinCloud` nu mai citea
  folderul când proiectul avea copertă. Proba de dinainte urcase pozele pe o
  ciornă **fără** poză principală, deci n-a prins-o. Acum citirea se oprește
  numai la pozele de pe disc (exportul WordPress), iar `/admin/poze` leagă
  folderul și după alegerea din panou, nu doar după dată.
- **Oricâte poze deodată**: pleacă una câte una. Proba urcă 119 poze de
  13–47 MB (1,7 GB), JPEG, PNG, WebP, una de 48 de megapixeli și una
  verticală; toate ajung sub 2 MB, în sub un minut.
- **Trei defecte prinse de proba grea, nu de citit:** (1) un text nou se
  deschidea cu titlul și textul celui salvat înainte — `TineCiorna` ștergea
  ciorna paginii pe care ajungea salvarea (`/admin/scrie/<id>`), nu a celei de
  unde plecase (`/admin/scrie/nou`); (2) după „Publică”, primul om care
  deschidea Proiecte vedea lista veche: `revalidateTag(…, "max")` servește o
  dată varianta veche; la tabere e acum `{ expire: 0 }`; (3) o tabără ștearsă
  rămânea în listă, cu link spre „pagina nu există” — ștergerea nu golea
  nimic. Galeria tăia în tăcere la 100 de poze; acum 500, maximul Cloudinary.
- Probă, în browser, cu Cloudinary de mențiune (poză de telefon de 9 MB, un
  fișier text redenumit în .jpg, publicare, pagina publică):
  `DATABASE_URL=… CHROMIUM=/opt/pw-browsers/chromium node scripts/qa/poze-tabara.mjs`

## Intrarea de probă: un browser automat pe site-ul adevărat

Probele locale merg cu servicii de mențiune, deci nu pot prinde tocmai
legătura adevărată (Cloudinary, Railway, Cloudflare). O cerere cu antetul
`x-proba-token` egal cu `PROBA_TOKEN` din Railway (cel puțin 15 semne)
intră în panou ca „Probă automată” (`lib/admin.ts`, `fel: "proba"`).

- **Vede toate paginile panoului** (afară de Utilizatori), ca să fie verificate
  pe site-ul adevărat; **scrie numai pe rutele de conținut** (`RUTE_PROBA` din
  `src/proxy.ts`): scrie, poze, cifre, texte,
  sponsori, documente, testimoniale, pagini, calendar, QR. Orice altă rută din
  `/api/admin` primește 403 de la proxy, **exportul pentru Excel și la GET**:
  nimic nu trimite în afară, nu atinge plăți și nu cheamă un model plătit.
  O rută nouă e închisă până e adăugată în listă.
- Antetul îl pune proxy-ul mediului de lucru; valoarea nu trece prin
  conversație și nu e în depozit. Fără variabilă, ușa nu există; **se închide
  ștergând `PROBA_TOKEN` din Railway**.
- **Modul de probă** (`lib/proba.ts`), din 11 noiembrie 2026: o cerere cu
  cheia trimite **orice** e-mail numai la `PROBA_EMAIL` (din Railway), cu
  „[PROBĂ]” în subiect; nu sună telefoanele (`notificaPanoul`), nu pune
  adrese în MailerLite (`laBuletin`), iar șablonul nu face ciorne și nu
  trimite în MailerLite. Așa se pot încerca pe site-ul adevărat și
  formularele publice, și munca de fundraiser (cereri, firme, jurnal,
  contract, transfer confirmat, apel la voluntari, comunicat, proba
  șablonului) — proxy-ul pune antetul pe toate cererile spre site.
- **Curățenia**: `POST /api/admin/curata-proba` (numai cu cheia) șterge
  rândurile cu adresa de probă din cereri, firme (cu contractele și jurnalul
  lor), donații, aniversări, contacte de presă etc. Panoul nu șterge
  dinadins rândurile oamenilor adevărați; ruta asta atinge numai adresa de
  probă. Ce se face cu cheia pe site se curăță la sfârșit.

## O fotografie nouă trebuie urcată și în Cloudinary

Cu `CLOUDINARY_CLOUD_NAME` setat, `next.config.ts` montează un încărcător
propriu, iar el traduce **orice** cale `/poze/an/luna/nume.jpg` într-o adresă
Cloudinary: `Teona/an/luna/nume`. Cele 389 de fotografii moștenite din
WordPress au fost urcate odată, în bloc, deci traducerea nimerea mereu — și
nimeni nu s-a mai gândit la ea.

**O fotografie pusă numai în `public/poze/` nu există în Cloudinary**: adresa dă
404 și pe pagină rămâne un dreptunghi gol. Nimic nu cade, nimic nu intră în
jurnal, `npm run build` trece, pagina se randează perfect.

S-a întâmplat pe 19 octombrie 2026: cele unsprezece fotografii primite de la
asociație pe Drive au stat o zi rupte — Casa Teona, Donează, „Scrisoarea pentru
Moș Crăciun" și siglele instituțiilor de pe Despre noi. Le-a văzut clientul, nu
eu.

- **Se urcă cu** `CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=…
  CLOUDINARY_API_SECRET=… node scripts/urca-poze-cloudinary.mjs public/poze`.
  Sare peste ce e deja acolo, deci se poate rula oricând. **Cheile se dau din
  mediu, niciodată scrise într-un fișier.**
- **Urcarea pune `public_id` cu bare în el, nu `folder`.** Contul e pe „dynamic
  folders", unde folderul e un câmp separat; dar încărcătorul construiește
  adresa din cale, iar aia e identificatorul. Urcate cu `folder`, pozele ar
  ajunge în locul potrivit din panoul Cloudinary și adresa de pe site ar da tot
  404.
- **Probă, fără chei secrete** (numele contului e public, apare în fiecare
  adresă de poză): `CLOUDINARY_CLOUD_NAME=… node scripts/qa/poze-lipsa.mjs`.
  Verifică numai căile care **există și în depozit** — regexul prinde și
  exemplele din comentarii, iar o probă care strigă la patru lucruri
  inexistente nu se mai citește după a treia rulare.
- Pozele urcate din panou (`/admin/scrie`, siglele sponsorilor) **nu** trec pe
  aici: ele pleacă direct în Cloudinary și se scriu `/cloud/<identificator>`.
  Capcana e numai pentru fișierele puse de mână în depozit.

## De unde vin donatorii

Fiecare donație începută de pe site păstrează **canalul** din care a venit
omul: e-mail, reclame Facebook sau Instagram, Facebook neplătit, Instagram,
reclame Google, căutare Google, altă căutare, cod QR tipărit, SMS, alt site,
direct. Numele lor stau o singură dată, în `src/lib/atribuire.ts`, și sunt
aceleași în care se traduc sursele din Google Analytics — de aceea în panou
vizitele și donațiile pot sta pe același rând.

- **Nu se ghicește nimic.** Canalul se scrie din eticheta linkului
  (`utm_source`, `utm_medium`), din `fbclid`/`gclid` sau din site-ul de pe
  care s-a venit. O donație fără urmă rămâne fără canal și se numără separat,
  în „nelegate" — nu se împarte „proporțional" pe canale.
- **Urma ține cât ține fila** (`src/lib/atribuire-browser.ts`, pusă în pagină
  de `src/componente/Urma.tsx`): omul vine din reclamă pe prima pagină și
  donează după două apăsări, când adresa nu mai are nicio etichetă. Se
  păstrează două cuvinte — canalul și perechea brută —, niciun identificator;
  `fbclid` se citește, se traduce în canal și **nu se scrie**. De aceea nu
  atârnă de bannerul de cookie-uri, pe care atârnă Google Analytics: acolo e
  un script străin care urmărește omul între site-uri, aici e un cuvânt
  despre o donație în curs.
- **Prima urmă câștigă** („first touch"): cine a venit din reclamă, a plecat
  pe Facebook să întrebe un prieten și s-a întors, rămâne al reclamei.
- Canalul merge și în metadatele abonamentului Stripe, deci **reînnoirile
  lunare îl păstrează** — altfel o donație lunară adusă de o reclamă s-ar
  număra acolo o singură lună.
- Canalul venit din browser se acceptă numai dacă e unul dintre numele
  noastre: altfel oricine ar umfla rândul reclamelor dintr-un formular.
- În panou, la `/admin/analiza`, „De unde vin donatorii": vizite (de la
  Google) lângă donații (din baza noastră), **niciodată adunate**.
- Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/atribuire.mjs`

### Reclamele Meta

Cu `META_TOKEN` și `META_AD_ACCOUNT_ID` în Railway, tot la `/admin/analiza`
se vede cât s-a cheltuit pe reclame, pe campanie, lângă donațiile venite din
canalul plătit. **Costul pe donație e o apropiere**, nu o măsurătoare: cele
două cifre vin din locuri care nu se cunosc. Numele contului e scris lângă
cifre — un cont greșit (al altei asociații, al agenției) ar umple panoul cu
cifre verosimile și false.

### Codurile QR

`/admin/qr` face codurile de tipărit, cu link etichetat
(`?utm_source=qr&utm_medium=offline&utm_campaign=<locul>`). Fiecare loc cu
numele lui, altfel nu se poate spune care afiș a adus oamenii. PNG pentru
tipar obișnuit, SVG pentru bannere. Codul se face aici, nu pe un site
gratuit, fiindcă alea duc la o adresă intermediară a lor: dacă se închide,
afișele tipărite rămân cu un cod mort.

### Lista de presă

`/admin/presa` ține cui se trimite un comunicat: redacțiile din Suceava, cu
e-mail, telefon, numele ziaristului și notițe („a scris despre tabăra din
iunie"). Sămânța (`src/date/presa-suceava.ts`) are **numai adrese citite de
pe paginile de contact ale publicațiilor**, verificate pe 16 octombrie 2026;
acolo unde site-ul n-a răspuns (Cloudflare) rândul rămâne fără adresă,
dinadins — se vede ce lipsește. Se pune o singură dată, la prima deschidere,
și numai dacă tabelul e gol: altfel un contact șters ar învia singur.

Comunicatul **pleacă din panou**, la cererea asociației (octombrie 2026):
bifezi redacțiile („Toate” / „Niciuna”), scrii subiectul și textul, pui cel
mult trei atașamente (10 MB), confirmi și apeși
(`/api/admin/presa/trimite`). **Fiecare redacție primește e-mailul ei**, cu
adresa ei la „Către”, nu o listă la Bcc — un mesaj către opt redacții
deodată, de la un server, ajunge în spam. Răspunsul merge la
contact@teona-ariana.ro. Adresele nu vin din formular, ci din baza de date
după identificatorii bifați: altfel serverul asociației ar trimite la orice
adresă scrisă de mână. E-mailul e simplu, fără bandă și butoane: ziaristul
vrea textul. Copierea adreselor pentru Gmail rămâne, strânsă dedesubt.
Pagina ține și forma unui comunicat pe care o redacție îl publică (titlu,
primul paragraf care spune tot, citat cu nume, contact) și amintește de
acordul părinților pentru pozele cu copii.

### Calendarul de publicare

`/admin/calendar` arată luna: ce s-a publicat, ce e plănuit (o ciornă cu zi
pusă, `texte.planificat_la`) și momentele care se repetă an de an — 25 mai,
2 aprilie, 1 iunie, 3 decembrie, taberele, începutul școlii, sărbătorile.
Alea sunt scrise o dată, în `src/date/calendar-fundraising.ts`.

**Nimic nu se publică singur.** Ziua pusă pe o ciornă e o intenție, nu un
ceas: un text bun azi poate fi nepotrivit în ziua în care l-ai plănuit.
Termenul Declarației 177 **nu** e trecut ca zi fixă — apare ca lucru de
confirmat cu contabilitatea firmei. O dată greșită într-un calendar e mai
rea decât una lipsă: după ea se face muncă.

Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/presa-calendar.mjs`

### Pagina de Facebook

`/admin/facebook` arată cifrele paginii (urmăritori, câți au văzut-o, câți
au reacționat) și trimite pe ea o noutate sau o campanie publicată, **la
apăsarea unui om**, o singură dată (`texte.facebook_id` ține minte). Linkul
din postare poartă etichetă, deci donațiile venite de acolo se văd separat
de reclame.

**Nu există buton „Conectează cu Facebook"**, și nu din lene: ca un site să
publice în numele unei pagini, Meta cere o aplicație aprobată, cu verificare
de business. Pentru o asociație mică, calea e un utilizator de sistem în
Business Manager, cu jeton care nu expiră: `META_PAGE_ID`, `META_PAGE_TOKEN`
(drepturi `pages_read_engagement`, `pages_manage_posts`, `read_insights`).
Pașii sunt scriși pe pagină. Probă:
`PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/facebook.mjs`

## Firma se completează din CUI

Pe `/directioneaza-20`, în formularul de sponsorizare și la contact, o firmă
scrie doar CUI-ul. Restul vine din datele publice ale ANAF (`src/lib/anaf.ts`,
prin `/api/firma`): denumirea, sediul, numărul de la registrul comerțului, iar
în calculator cifra de afaceri și impozitul din ultimul bilanț depus.

- **Impozitul e o propunere, nu o certitudine.** Bilanțul nu conține „impozit
  pe profit”; conține profit brut și profit net, iar diferența dintre ele e
  impozitul plătit. Pentru o firmă pe impozit pe profit asta e cifra căutată,
  pentru una pe impozit pe venit nu e. De aceea pagina scrie de unde vine cifra
  și din ce an, câmpul rămâne editabil, iar „Calculul este orientativ” rămâne
  unde era.
- **Procentele din calculator:** 20% din impozitul pe profit și 0,75% din cifra
  de afaceri; suma e cea mai mică dintre ele.
- **Suma din contract se scrie, nu se presupune.** Câmpul vine completat cu
  maximul calculat, dar se poate schimba: o firmă poate sponsoriza mai puțin
  decât îi permite legea, iar contractul trebuie să poarte suma pe care o dă
  ea, nu plafonul. Contractul iese pe loc, în Word sau PDF, cu denumirea,
  sediul și nr. de la registrul comerțului de la ANAF; rămân de completat
  cine semnează și în ce calitate.
- **Registrul contractelor** (`/admin/contracte`): numărul nu se mai scrie de
  mână, se dă singur la generare, pe an, de la 1 — iar rândul intră în registru
  cu firmă, CUI, sumă, dată și stadiu. Word și PDF-ul aceluiași contract împart
  un număr (se refolosește rândul „generat" al aceleiași firme, cu aceeași
  sumă); o a doua sponsorizare, cu altă sumă, primește alt număr. `UNIQUE (an,
  numar)` nu lasă două contracte „3/2026" să existe, iar la coliziune se
  încearcă următorul număr liber.
  **Registrul nu ține fișierul**: documentul se descarcă și se trimite firmei;
  ce semnează ea se întoarce pe e-mail. Un PDF ținut și la noi ar fi al
  treilea loc în care același document poate să difere.
  Sus stau totalurile anului și, separat, **„semnate, bani neintrați"** —
  sponsorizarea se scade din impozitul anului **în care a fost plătită**, deci
  un contract semnat în noiembrie și plătit în ianuarie pierde anul fiscal
  pentru firmă. Dedesubt, **cine a sponsorizat înainte și anul ăsta nu**: în
  ianuarie, lista aia e cea mai ieftină sursă de bani a asociației.
  Probă: `BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/contracte.mjs`
- **Contractul făcut de firmă pe site intră în panou întreg.** Câmpurile cu
  steluță (cine semnează, e-mailul, suma) se cer în pagină **și** pe server —
  un contract a ieșit odată fără e-mail și n-a lăsat nicio urmă în panou.
  Înainte de document, ruta scrie fișa firmei, ia un număr din registru
  (`numarPentruContract`, deci a doua descărcare refolosește numărul), pune
  data de azi, mută firma la „contract trimis” și scrie o notiță cu tot ce a
  completat. Calculatorul nu mai descarcă direct: duce la același formular,
  cu CUI-ul și suma puse. Word-ul tipărește și el numărul și data (rândul
  era scris fix, cu puncte — și pentru contractele din panou).
  Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/traseu-contract.mjs` — numai
  pe o copie locală, fiindcă scrie în registrul de contracte.
- **Cifra de control a CUI-ului** se verifică în browser înainte de orice
  cerere: cheia e aliniată la dreapta, cu zerouri în față (`src/lib/cui.ts`).
- Căutarea nu blochează nimic: dacă ANAF nu răspunde, câmpurile se completează
  de mână. O firmă înființată luna trecută n-are bilanț și trebuie totuși să
  poată trimite formularul.
- Probă: `BAZA=http://localhost:3000 node scripts/qa/firma-anaf.mjs` (cere
  internet — datele vin de la ANAF, în direct).

## Conturile: cine intră în panou

Panoul a mers cu **o singură parolă**, în `PAROLA_ADMIN`, cât timp îl deschideau
două persoane care făceau același lucru. Omul de strângere de fonduri schimbă
socoteala, în trei feluri care n-au nicio legătură cu neîncrederea:

- **nu se putea opri unul singur** — ca să-i iei accesul trebuia să schimbi
  parola tuturor, deci să suni pe toată lumea;
- **nu se vedea cine a făcut ce** — jurnalul discuțiilor spunea „l-am sunat”,
  nu cine l-a sunat. Când sună doi oameni, rândul fără nume e aproape
  nefolositor: se sună de două ori sau niciodată;
- **nu se putea da mai puțin** — parola deschide tot, inclusiv facerea de
  conturi noi și, mâine, orice pagină adăugată. Azi cele două roluri sunt
  aproape la fel (vezi tabelul); ce s-a câștigat e că *se poate* da mai puțin,
  fără să rescrie nimeni nimic — un contabil, un voluntar venit pe o lună, un
  om care are nevoie numai de rapoarte.

Acum sunt **două roluri**, scrise o dată în `src/lib/utilizatori.ts`:

| | administrator | strângere de fonduri |
|---|---|---|
| tabloul de bord, rapoarte, analiză | da | da |
| donații, donatori, firme, contracte | da | da |
| cereri, aniversări, **Formulare 230** | da | da |
| șabloane, mesaje, QR, presă, calendar, căutare | da | da |
| **scrie pe site, poze, Facebook** | da | da |
| utilizatori | da | — |

**Rolul de fundraising deschide tot panoul în afară de conturi.** Așa a cerut
asociația, și două lucruri din tabel merită scrise negru pe alb, ca să nu pară
scăpări:

- **Formularele 230 au CNP-uri în ele** și legătură de WhatsApp către oameni.
  Rolul le are fiindcă redirecționarea a 3,5% din impozit *este* muncă de
  strângere de fonduri, iar cine o face trebuie să-i poată suna. Un rol de
  fundraising înseamnă deci acces la date personale sensibile — de aceea
  contează cui se dă, și de aceea oprirea contului are efect pe loc;
- **scrisul pe site, pozele și Facebook** fuseseră lăsate deoparte fiindcă o
  publicare greșită nu se mai ia înapoi. Dar rolul avea deja șabloanele de
  e-mail pentru campanii: pleca poșta despre o campanie pe care omul nu putea
  s-o creeze.

Utilizatorii lipsesc fiindcă **cine poate face conturi își poate face unul de
administrator** — dreptul ăla *este* dreptul de administrator, iar dat altcuiva
rolurile n-ar mai însemna nimic. Textul rolului din panou spune pe față cât dă:
un nume care sună mai strâmt decât e („strângere de fonduri", care deschide
aproape tot) e felul în care cineva dă mai mult acces decât crede.

Cum merge, punct cu punct:

- **`PAROLA_ADMIN` rămâne**, ca cheie a asociației: deschide tot, n-are nume și
  nu lasă urmă în jurnal. Din ea se face primul cont, și cu ea se intră când
  s-a încurcat ceva — fără ea, un tabel gol de utilizatori ar însemna un panou
  în care nu mai poate intra nimeni. Pe `/admin/utilizatori` scrie pe față când
  ești înăuntru cu ea.
- **Parolă, nu link pe e-mail.** Contul donatorului (`cont.ts`) intră fără
  parolă, dinadins, și argumentul de acolo rămâne întreg — un donator intră de
  două ori pe an și ar uita parola. Aici sunt trei-cinci oameni care intră
  zilnic: un link cerut la fiecare intrare ar face munca de zi mai grea, iar
  cutia poștală ar deveni singura cheie a panoului. Parolele stau trecute prin
  **`scrypt`**, cu sare pe fiecare și cu parametrii scriși lângă amprentă, ca o
  întărire de mai târziu să nu dea afară oamenii cu parole vechi.
- **Oprirea are efect pe loc.** Contul se citește din baza de date la *fiecare*
  cerere, nu doar la intrare: un om oprit la 10:00 nu mai intră la 10:01, nu la
  expirarea cookie-ului de douăsprezece ore. Ăsta e tot rostul conturilor.
- **Conturile nu se șterg, se opresc.** Jurnalul poartă numele celui care a
  scris rândul, iar „l-a sunat cineva care nu mai există” e mai rău decât
  numele unui om plecat.
- **Dreptul se cere în trei locuri, din aceeași listă**: pagina (care se
  închide), meniul (care nu mai arată linkul) și ruta din `/api/admin` (care
  refuză chiar și adresa scrisă de mână). Un drept uitat într-unul din ele ar
  lăsa o pagină ascunsă în meniu, dar deschisă pentru cine îi știe adresa. De
  aceea `/admin/utilizatori` scrie tabelul de mai sus din `PAGINI`, nu de mână:
  un tabel scris separat ar rămâne în urmă la prima pagină nouă și ar spune
  despre panou ceva care nu mai e adevărat.
- **Exportul CSV cere dreptul listei cerute**, nu unul pentru toată ruta: cele
  patru liste sunt exact patru pagini, iar fișierul are în el aceleași nume și
  adrese.
- **Contul se face cu o invitație, nu cu o parolă scrisă de altcineva.**
  Varianta de dinainte — administratorul scrie parola și i-o trimite omului —
  are trei găuri deodată: parola rămâne scrisă într-o conversație de WhatsApp
  pe care n-o șterge nimeni, administratorul o știe până când (dacă) o schimbă
  omul, iar omul n-are niciun motiv s-o schimbe, fiindcă merge. Acum butonul
  dintâi e **„Trimite invitația"**: contul se naște **fără parolă**, iar omul
  și-o pune singur din linkul primit pe e-mail. Un cont fără parolă nu poate
  intra — `intraCuParola` cere o amprentă ca s-o compare — deci nu e o ușă
  deschisă, e o ușă care încă n-are cheie.
  „Fac eu parola" rămâne, pentru când e-mailul nu pleacă: un cont care nu se
  poate deschide nu ajută pe nimeni.
  Linkul ține **șapte zile**, merge **o singură dată**, și moare la: folosire,
  o invitație nouă, oprirea contului. Clipa invitației (`utilizatori.invitat_la`)
  **intră în semnătură**, nu doar lângă ea — altfel cine are linkul ar putea
  încerca alte clipe. Pagina publică `/invitatie` **nu scrie numele, adresa sau
  rolul**: linkul poate ajunge greșit, iar „Bună, Mihaela" i-ar spune
  străinului pe cine a nimerit.
  Probă, cu un server de e-mail de mențiune care prinde linkul și merge pe tot
  drumul — face contul, pune parola, **intră cu ea**, apoi verifică că linkul
  nu mai merge a doua oară:
  `BAZA=… PAROLA_ADMIN=… node scripts/qa/invitatie.mjs` (serverul se pornește
  cu `EMAIL_API=http://127.0.0.1:4390 RESEND_API_KEY=probă`).
  **Două bug-uri le-a prins proba, nu cititul codului:** `invitat_la` e
  `timestamptz` cu microsecunde iar linkul duce milisecunde, deci comparate ca
  date nu se potriveau niciodată — omul primea „linkul a fost deja folosit",
  fără nimic în jurnal; și o cădere a bazei de date era raportată în panou ca
  „există deja un cont cu adresa asta", deci administratorul încerca altă
  adresă și primea același mesaj.
- **Parola nu trece niciodată prin adresă** și nu se arată nicăieri — nici cea
  pusă de administrator, când alege calea aia. El o scrie, deci o știe; i-o
  spune omului cum vrea, iar omul o schimbă din `/admin/parola`, unde se cere
  și parola de acum (un laptop lăsat deschis nu e de ajuns ca să iei contul
  definitiv). După asta n-o mai știe nimeni altcineva.
- **Nimeni nu se oprește singur** și nu-și scade singur rolul: butoanele stau
  pe același rând la toți, iar al tău e primul pe care îl nimerești.
- Răspunsul la o adresă necunoscută e **la fel** ca la o parolă greșită sau un
  cont oprit — altfel formularul de intrare devine un instrument de aflat cine
  lucrează la asociație.
- Probă: `BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/utilizatori.mjs`
  (face și șterge singură un cont de probă; **patru intrări**, cât încape în
  limita de 5 la 15 minute a rutei de intrare — a doua rulare la rând ia 429,
  ceea ce e limita care funcționează, nu o cădere).

### Panoul ca aplicație, ținut minte, cu cod rapid

Cerut în octombrie 2026: panoul instalat pe telefon și pe calculator, să
rămână logat și să se intre repede. **Numai panoul**, nu site-ul public.

- **Aplicația** (PWA): manifestul e la `/admin/manifest.webmanifest`, cu
  `scope: /admin/`, legat numai din `src/app/admin/layout.tsx`. Lucrătorul e
  la `/admin/sw.js` și **nu păstrează nimic** — panoul are CNP-uri și
  telefoane, iar o copie în memoria telefonului ar rămâne acolo și după ce
  contul e oprit. Există doar ca aplicația să se poată instala și ca fără
  internet să apară o pagină care spune asta. Prinde numai deschideri de
  pagină (GET); formularele trec pe lângă el. Butonul „Instalează aplicația”
  stă jos în bară și pe pagina de intrare; pe iPhone arată pașii din Safari.
- **„Ține-mă minte pe acest dispozitiv”** (bifat din start): sesiune de 30 de
  zile în loc de 12 ore și un cookie de dispozitiv (`teona_dispozitiv`, 90 de
  zile, semnat cu alt prefix decât sesiunea). **Numai pentru conturi**:
  parola asociației rămâne la 12 ore, oricum ar fi bifat. Contul se citește
  oricum la fiecare cerere, deci un om oprit iese pe loc.
- **Codul de intrare rapidă** (4–6 cifre, `utilizatori.pin`, prin scrypt):
  se pune de la `/admin/parola`, cu parola de acum. Pagina de intrare cere
  codul în locul parolei **numai** pe un dispozitiv ținut minte, al unui cont
  cu cod. Cinci coduri greșite la rând (`pin_gresit`) îl închid până la o
  intrare cu parola, iar dispozitivul e uitat; limita de 5 la 15 minute a
  rutei de intrare se aplică și codului. „Uită acest dispozitiv” e tot acolo.
- `pregatesteParola` cere 12 semne; codul trece prin `trece()` direct. Cu
  `pregatesteParola` ruta dădea 500 la orice cod — prins de probă.
- **Datele sensibile cer o confirmare proaspătă.** Formulare 230, Cereri și
  descărcarea listelor pentru Excel cer din nou codul sau parola dacă au
  trecut 12 ore de la ultima intrare (`sesiuneProaspata()` din
  `lib/admin.ts`). Nu e nicio coloană nouă: o sesiune scurtă ține 12 ore,
  deci e mereu proaspătă, iar vârsta uneia lungi se citește din expirarea
  semnată. Pusă de acum, fiindcă se poate ca pe viitor să apară CNP-uri în
  panou; azi nu e niciunul.
- Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/cod-rapid.mjs` — 12
  verificări; își face contul de probă și îl oprește la sfârșit, iar fiecare
  încercare de cod pleacă din alt „loc”, ca limita rutei de intrare să nu
  oprească proba înainte de a cincea greșeală.

## Baza de voluntari și apelurile către ei

`/admin/voluntari` (ambele roluri) citește cererile de voluntariat venite de pe
site — **nu e un tabel nou**: aceeași fișă se vede la Cereri, la căutare și în
export. Sus stau filtrele după care se caută un om pentru o zi anume:
localitatea, cât timp are, limba, cum preferă să fie contactat, „are permis”,
„experiență cu copii”, „numai 18+”. Filtrele sunt un GET, deci o căutare se
poate trimite cuiva ca link.

- **Cum preferă să fie contactat** se întreabă în formular (Telefon, WhatsApp,
  E-mail; din start Telefon). Cine alege telefon sau WhatsApp trebuie să
  scrie numărul. În panou, calea aleasă de om e butonul plin; lângă ea, celelalte.
  Serverul primește numai cele trei valori: altceva nu ajunge în fișă.
- **Apelul** („avem nevoie de voluntari pe data X”): se bifează oamenii
  (din start toți cei din lista filtrată), se scrie pentru ce, când, unde și
  ce vor face. Fiecare primește **e-mailul lui** (`lib/email/apel-voluntari.ts`;
  cel mult 50 pe e-mail, vezi „Site-ul nu face campanii”),
  cu „Da, pot veni” și „Nu pot de data asta”. Adresele vin din baza de date,
  nu din formular. Pentru cei care preferă WhatsApp, la apel e un link
  `wa.me` cu textul și linkul lor de răspuns gata scrise.
- **Răspunsul se dă cu un buton, nu la deschiderea linkului** (`/voluntari/raspuns`
  → POST `/api/voluntari/raspuns`): scanerele de e-mail deschid toate
  adresele dintr-un mesaj. Semnătura acoperă apelul și voluntarul; pagina nu
  scrie numele omului. Un „pot” trimite notificare pe telefon în panou.
- Tabelele `apeluri_voluntari` și `raspunsuri_voluntari` stau în `ADAOSURI`.
- Probă, pe tot drumul (înscriere, filtre, apel pe e-mail, răspuns, link
  falsificat): `PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/voluntari.mjs`
  — 27 de verificări, numai pe o bază locală.

## Radarul de finanțări: caută singur, nu hotărăște nimic

Patru termene mari au trecut pe lângă asociație în 2026 — Fondul SEE (8
octombrie), subvenția pe Legea 34/1998 (sfârșitul lui septembrie, pentru 2027),
apelul AFCN–Orange, apelul POIDS. Toate fuseseră anunțate public, cu luni
înainte. N-au fost ratate din lipsă de informație, ci pentru că nimeni n-avea
în sarcină să se uite: un om care face și comunicarea și evidența nu deschide
șase site-uri în fiecare luni.

`/admin/radar` caută în locul lui, o dată pe săptămână. Modelul primește
unealta de **căutare pe server** (`web_search_20260209`, în `src/lib/radar.ts`),
caută apeluri pentru care asociația ar fi eligibilă, și scrie ce a găsit în
tabelul `radar`.

**Caută, citește, scrie într-un tabel. Nu trimite nimic și nu depune nimic.**
Un om deschide pagina, se uită, apasă „merită urmărit" sau „nu ne privește".
Aceeași regulă ca la publicare: nimic nu pleacă singur.

### Cum se apără de inventat

Partea care contează cel mai mult, fiindcă un termen greșit e mai rău decât
unul lipsă: după el se face muncă.

- **Adresa trebuie să fi apărut într-un rezultat de căutare adevărat.** Se
  adună toate adresele din blocurile `web_search_result` ale conversației, iar
  o pistă a cărei adresă nu e între ele **se aruncă**. Dacă modelul scrie un
  link verosimil pe care nu l-a văzut, nu intră în tabel. Câte s-au aruncat se
  vede în panou: dacă cifra crește, modelul inventează și întrebarea trebuie
  strânsă.
- **Termenul se păstrează ca text, nu ca dată.** Modelul citește „8 octombrie
  2026" sau „nu scrie" de pe o pagină; un câmp de tip dată l-ar obliga să
  ghicească, iar ghicitul ar arăta în panou exact ca o certitudine. Ce a citit
  se scrie cum l-a citit, cu linkul lângă.
- **Fiecare rând e o pistă, nu o certitudine**, și pagina scrie asta pe ea.
  Nimic de aici nu intră în calendar până nu deschide un om pagina sursă.
- **Cheia e adresa.** Aceeași oportunitate găsită săptămâna viitoare nu intră a
  doua oară și nici nu învie un rând respins deja de un om (`ON CONFLICT DO
  NOTHING`). Altfel lista ar fi, după o lună, aceleași zece rânduri respinse
  care se întorc în fiecare luni.

### Trei capcane ale uneltei de căutare

Niciuna nu se vede la citit codul, și toate trei ar trece drept „n-a găsit
nimic":

- **o căutare picată nu aruncă nicio excepție.** Vine cu HTTP 200 și un bloc
  al cărui `content` e un *obiect* cu `error_code`, în loc de *lista* de
  rezultate. Fără `Array.isArray`, codul ar continua cu zero adrese văzute, iar
  filtrul de mai sus ar arunca toate pistele;
- **API-ul se oprește la jumătate.** Cu unelte pe server rulează o buclă
  proprie și după zece pași întoarce `stop_reason: "pause_turn"`. Reluarea se
  face trimițând înapoi întrebarea și răspunsul de până atunci — **fără** un
  mesaj „continuă": API-ul vede blocul de unealtă neterminat și știe singur.
  Fără reluare, radarul vede doar prima jumătate din internet;
- **nu se declară și execuția de cod** pe lângă unealta de căutare: varianta
  asta o rulează oricum pe dedesubt, iar un al doilea mediu de execuție
  încurcă modelul.

### Cum rulează săptămânal

**Orarul stă în afara aplicației.** Un `setInterval` într-un server web pare
cea mai simplă cale și e cea mai înșelătoare: Railway repornește containerul la
fiecare publicare, poate rula mai multe copii ale aplicației deodată — deci
scanarea ar pleca de două ori — și un container adormit nu numără nimic.

Cron-ul de pe Railway pornește un serviciu care **se încheie**; aplicația web
nu se încheie niciodată, deci nu i se poate pune un orar. Al doilea serviciu e
**`radar-luni`, o funcție Railway (Bun)**, cu `RADAR_SECRET` luat prin
referință (`${{site.RADAR_SECRET}}`), care face un `fetch` și iese. Prima
variantă a fost imaginea `curlimages/curl` cu comanda în „Start Command”: n-a
mers niciodată — Railway îi dădea argumentele într-un fel pe care curl nu-l
înțelegea („try 'curl --help'”) și serviciul stătea „Running” zeci de ore.
Echivalentul ei, pentru referință:

```
curl -fsS -X POST https://<site>/api/radar -H "x-radar: $RADAR_SECRET"
```

Orarul se pune pe serviciul ăla: `0 6 * * 1` = luni la 6:00 **UTC** (cron-ul de
pe Railway e în UTC, nu ora României). Granularitatea minimă e 5 minute, iar
dacă o rulare mai e în curs când vine următoarea, Railway o sare — nu le
stivuiește. Pașii sunt scriși și pe pagină, ca la Facebook: omul care se
întreabă „de ce n-a mai scanat nimic?" e în panou, nu în depozitul de cod.

**Scanarea rulează după răspuns** (`after()` din `next/server`), atât din
butonul din panou cât și din cron: durează minute, iar ținută în cerere era
tăiată de proxy-ul Railway (502) fără să lase vreun rând în `radar_scanari`.
Cron-ul primește deci 202 „a pornit”; rezultatul și eroarea se văd în panou.

**Secretul nu e opțional.** Adresa cheltuiește bani la fiecare apel — cheamă un
model și plătește căutări. Fără `RADAR_SECRET` configurat, ruta refuză de tot
(503) în loc să rămână deschisă; cu secret greșit, 403, și nici într-un caz nu
se cheamă modelul. Limită de 3 apeluri pe oră, pe lângă secret: o scanare pe
săptămână e ce trebuie, iar cinci pe oră înseamnă că s-a stricat ceva — un orar
pus de două ori — și limita oprește factura înainte s-o vadă cineva.
Câte căutări are voie o scanare se scrie în `RADAR_CAUTARI` (implicit 12).

**Un radar mort în tăcere e mai rău decât niciunul**, fiindcă liniștea arată la
fel ca „n-a apărut nimic nou". De aceea scanările se scriu în
`radar_scanari`, cu erorile lor, se văd în panou, pagina spune răspicat când
ultima e mai veche de 10 zile, iar o scanare cu probleme întoarce cod de
eroare — deci se vede și în jurnalul serviciului de cron, nu numai în panou.

Model din `MODEL_RADAR`, implicit `claude-opus-5-5` (unealta de căutare cere un
model care o are). Probă, fără chei adevărate și fără internet, cu un API de
mențiune care joacă toate cele patru scenarii — pistă inventată, căutare
picată, `pause_turn`, pistă respinsă care nu învie:
`PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/radar.mjs`

## Panoul: ce se face de unde

- **`/admin`** — tabloul de bord. Începe cu „De făcut acum" (cereri noi,
  aniversări de aprobat, firme fără răspuns de două săptămâni, ciorne), apoi
  cifrele: total, luna asta față de luna trecută, **cât vine lunar** din plăți
  recurente, ultimele donații cu nume, progresul campaniilor.
- **`/admin/scrie`** — noutăți și campanii, scrise de asociație. Ciornă până
  când cineva apasă „Publică". Textul e simplu: rând gol = paragraf nou,
  `##` = subtitlu, `-` = punct de listă. Poza cere descriere, altfel nu se
  urcă. Asistentul (cu `ANTHROPIC_API_KEY`) scrie o primă ciornă.
- **`/admin/aniversari`** — aprobarea campaniilor de ziua cuiva. Se numea
  `/admin/campanii`; adresa veche redirecționează.
- **`/admin/cifre`** — cele patru cifre de pe site. Vezi secțiunea de mai sus.
- **`/admin/documente`** — fișierele de descărcat: Formularul 230, declarația
  de consimțământ, informarea GDPR, cele două contracte. Vezi mai sus.
- **`/admin/sponsori`** — siglele firmelor care vă susțin. Vezi mai sus.
- **`/admin/texte`** — ce scrie pe paginile fixe: Despre noi, Casa Teona,
  Donează, frazele din capul paginilor. Vezi mai sus.
- **`/admin/poze`** — ce e în Cloudinary și la ce proiect au ajuns pozele.
- **`/admin/radar`** — ce a găsit căutarea automată pe internet: apeluri de
  finanțare noi, ca piste de verificat la sursă. Vezi secțiunea de mai sus.
- **`/admin/utilizatori`** — conturile oamenilor: făcute, oprite, cu rolul
  schimbat. Numai administratorii. Jos, tabelul „ce vede fiecare rol", scris
  din aceeași listă din care se hotărăște accesul.
- **`/admin/parola`** — fiecare își schimbă parola lui, cu cea de acum în mână.
  Deschisă tuturor; cine e înăuntru cu parola asociației află de aici că ea se
  schimbă în Railway, nu de pe pagină.
- **Contractul de sponsorizare** se generează din fișa firmei
  (`/admin/firme/<id>/contract`): denumirea și contactul vin din fișă, sediul
  și nr. de la registrul comerțului de la ANAF după CUI, clauzele sunt cele
  din contractul asociației, cuvânt cu cuvânt. Iese PDF de două pagini, cu
  diacritice, și mută firma la „contract trimis".
- **`/admin/rapoarte`** — cifrele unei perioade încheiate, scoase ca PDF:
  **lunar** (pentru ședință și consiliul director), **anual** (pentru raportul
  de activitate și finanțatori) și **pe campanie**. Toate numără numai ce s-a
  încasat — un transfer anunțat, dar negăsit în extras, apare separat, ca lucru
  de verificat — și arată sumele în euro neconvertite. Raportul lunar conține
  nume de donatori și scrie pe el că e intern; celelalte două n-au nicio dată
  personală, dinadins, ca să poată fi atașate la un e-mail fără a doua privire.
  Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/rapoarte.mjs`.
- **`/admin/analiza`** — profilul donatorilor (câte donații face un om, cât
  adună, câți se întorc, câți s-au oprit, cât trece până la a doua donație) și
  profilul firmelor (pâlnia, rata de conversie, cât durează drumul până la bani
  în cont). Dedesubt, o citire a cifrelor făcută de model, păstrată în tabelul
  `analize` ca să nu se plătească de două ori aceeași întrebare.
  **Spre model pleacă numai agregate** — numărători, sume, procente; niciun
  nume, niciun e-mail, niciun telefon. Textul trimis se vede pe pagină, înainte
  de apăsarea butonului. Proba verifică asta la nivel de rețea, cu un server
  care imită API-ul Anthropic (`ANTHROPIC_API` îi dă adresa):
  `BAZA=… PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/analiza.mjs`.
  Fără `ANTHROPIC_API_KEY` pagina rămâne utilă: cifrele se calculează oricum,
  doar interpretarea lipsește.
- **Consultantul de strângere de fonduri**, tot la `/admin/analiza`, sub
  analiză: o casetă în care se vorbește. Analiza scrisă răspunde la „cum
  stăm"; munca începe la întrebarea următoare — „de unde încep cu cei care
  s-au oprit?", „ce le scriu firmelor care n-au răspuns?" —, iar alea nu se
  pot ghici dinainte, deci nu încap într-un raport scris o dată pe lună.
  **Știe patru lucruri și numai patru:** uneltele platformei
  (`src/lib/analiza/platforma.ts` — pagini de ziua ta, calculatorul firmelor,
  șabloanele de e-mail, segmentele, exportul, ce mesaje pleacă automat),
  **cum se caută firme de la care se cer bani**
  (`src/lib/analiza/prospectare.ts`, mai jos), calendarul fiscal (25 mai
  pentru Formularul 230 e sigur; termenul Declarației 177 nu, îl confirmă
  contabilitatea firmei) și **aceleași agregate** ca analiza scrisă. Nu are
  nume, adrese sau telefoane și nu poate avea: întrebat cine a donat cel mai
  mult, trimite la segmentele din panou.
  Partea fixă — regulile, tonul, uneltele și metoda de prospectare — poartă
  `cache_control`, deci a doua întrebare costă a zecea parte din prima.
  Conversația nu se salvează.
  Model din `MODEL_ANALIZA`, implicit `claude-opus-5-5`, prin SDK-ul oficial.
  Aceeași probă verifică ambele căi spre model: `scripts/qa/analiza.mjs`.
- **Tonul: fără vânzători de vise** (`src/lib/analiza/ton.ts`). Un model pus
  să fie „consultant" sau „antrenor" alunecă singur în registrul de guru de pe
  internet: entuziasm, cadre de lucru cu nume inventate, promisiuni de
  rezultate, „best practice" fără sursă, încurajare la final. Registrul ăla
  sună a ajutor și nu ajută — omul citește cinci rânduri calde și rămâne fără
  nimic de făcut luni dimineață, iar timpul lui e singura resursă care nu se
  mai întoarce.
  Regulile interzic pe nume: lauda întrebării, motivarea, metodele cu nume
  inventate, promisiunile de rezultate, autoritatea care nu există („studiile
  arată"), jargonul („mindset", „funnel", „scalare", „win-win" — „pâlnia
  firmelor" rămâne, așa se numește pagina) și verbele care nu spun nimic
  („optimizează", „valorifică"). În schimb cer: ce anume, cu cine, când și cât
  ia; ce costă, nu doar ce aduce; **„nu merită făcut"** când nu merită; „nu
  știu" când nu se știe; și spus pe față când problema nu e de fundraising.
  Fișierul ține și o pereche „așa nu / așa da" scrisă întreagă — un model își
  schimbă purtarea mai mult de la un exemplu contrastant decât de la zece
  reguli abstracte.
  Se scrie **o dată, pentru toate căile spre model**: analiza scrisă și
  consultantul au prompturi diferite, dar dacă tonul ar fi scris de două ori,
  una din copii s-ar strica fără să observe nimeni. **Nu scrie numele nimănui:**
  registrul se descrie prin ce face, nu prin cine îl face — un nume de om real
  pus într-un fișier ca exemplu de ce să nu fii rămâne în istoricul depozitului
  pentru totdeauna. Proba verifică pe amândouă căile că regulile pleacă spre
  model; tonul răspunsului nu se poate verifica cu un API de mențiune, dar
  regulile sunt singurul lucru care îl ține.
- **Antrenorul de prospectare**, în același consultant
  (`src/lib/analiza/prospectare.ts`): de unde ies firmele de la care se cer
  bani, pe cine se caută în ele și în ce săptămână a anului se sună.
  **Lista de firme nu vine de pe LinkedIn**, și scrie de ce: firmele mici din
  Suceava n-au prezență acolo, deci o listă făcută din LinkedIn e lista
  firmelor cu departament de marketing, nu a celor cu bani de sponsorizare.
  LinkedIn e pentru pasul următor — găsește *omul* din firma deja aleasă și
  drumul cald până la el.
  Țintirea vine din lege, nu din intuiție: plafonul e cel mai mic dintre 20%
  din impozitul pe profit și 0,75% din cifra de afaceri, deci o
  microîntreprindere pe impozit pe venit n-are de unde să scadă sponsorizarea.
  Asta se verifică înainte de primul telefon, cu calculatorul care există deja
  pe `/directioneaza-20`. Fereastra cea mai bună e octombrie–noiembrie:
  sponsorizarea se scade din impozitul anului **în care a fost plătită**.
  **Nu dă nume de firme.** N-are bază de firme, iar un nume scos din memoria
  modelului poate fi greșit sau vechi — iar asociația ar suna pe cineva pe
  baza lui. Nu scrie nici cifre despre LinkedIn (câte filtre, câte rezultate,
  cât costă abonamentul): se schimbă des, iar sursele nu se potrivesc între
  ele. Metoda ține, cifrele n-ar ține nici șase luni.
  Proba verifică, la nivel de rețea, că blocul ajunge la model, că e păstrat
  în cache și că **niciun șablon `${…}` necompletat** nu pleacă spre el — un
  rând scris între ghilimele în loc de accente grave nu se interpolează
  niciodată și nu dă nicio eroare, ci ajunge la model ca text brut. Aceeași
  greșeală ca „Sorem ipsum" de pe site-ul vechi.
- **Ce a adus fiecare campanie**, tot la `/admin/analiza`: cât s-a strâns, din
  câte donații, de la câți oameni, cât din țintă și câte vizite au venit din
  linkul ei. **Banii vin din baza noastră, vizitele de la Google** — două
  surse diferite, puse una lângă alta, nu adunate: o campanie cu multe vizite
  și nicio donație e altceva decât una pe care n-a văzut-o nimeni, iar fără
  amândouă cifrele nu se poate spune care dintre ele e. Donațiile fără
  eticheta unei campanii se scriu separat, cu mențiunea că asta nu înseamnă
  că n-au venit dintr-una — doar că n-am putut-o lega. Aceleași cifre intră
  și în ce vede consultantul.
- **Vizitele din Google Analytics**, tot la `/admin/analiza`, sus: câți
  oameni au intrat pe site în ultimele 28 de zile, de unde au venit (sursele
  sunt traduse: „google / organic" se citește „Căutare Google"), ce pagini au
  văzut și ce au adus linkurile etichetate — adică exact ce a adus fiecare
  buletin de e-mail. Nimeni nu intră în Google Analytics; panoul se deschide
  oricum. **Cifrele de vizite nu sunt donații** și scrie asta pe pagină:
  Google numără vizite, baza de date numără donații; când nu se potrivesc,
  baza de date are dreptate. Aceleași cifre intră și în rezumatul trimis
  modelului, cu aceeași atenționare.
  Se face cu un cont de serviciu Google (JWT semnat de mână, ca semnătura AWS
  de la R2 — bibliotecile Google ar fi adus 20 MB pentru o pagină de cod):
  în Google Cloud un proiect cu `analyticsdata.googleapis.com` pornit, un cont
  de serviciu cu cheie JSON, contul adăugat ca **Vizualizator** pe
  proprietatea GA4, iar în Railway `GA_PROPERTY_ID` (numărul, nu „G-…"),
  `GA_CLIENT_EMAIL` și `GA_PRIVATE_KEY`. Fără ele, pagina spune ce lipsește;
  dacă Google nu răspunde, restul panoului merge mai departe.
  Probă, cu un Google de mentiune care verifică semnătura cu cheia publică
  pereche: `PAROLA_ADMIN=… node scripts/qa/analytics.mjs`.
- **Export pentru Excel** pe donații, donatori, firme și cereri: `;` ca
  separator, BOM la început și virgulă zecimală — fără ele, Excel-ul românesc
  citește 150 de lei ca 150 de milioane de miliarde.
- **Căutare peste tot**, din bara din stânga: nume, e-mail, telefon sau CUI, în
  donatori, firme și cereri deodată.
- **Segmente de donatori**: „s-au oprit" (au dat de cel puțin două ori, nimic
  în ultimele patru luni) și „donatori mari" (peste 1.000 de lei adunat;
  pragul e în `src/lib/plati/donatori.ts`).
- **Formularele 230** primite de pe site, cu fișierul lor, sunt la
  `/admin/formulare`.
- **`/admin/emailuri` — toate mesajele pe care le trimite site-ul**, compuse cu
  date de probă („Maria Popescu", „Firma de probă SRL"), separate în ce primesc
  oamenii și ce primiți voi. Se deschid, se citesc, nu se trimite nimic de
  acolo. Până la ea, singurul fel de a vedea ce primește un donator era să
  donezi — iar un telefon vechi sau o frază neterminată ar fi stat acolo ani.
  Jos, pagina scrie și **ce nu pleacă de la sine, dinadins**: buletinele (alea
  sunt din MailerLite), mulțumirea când transferul nu se găsește, confirmarea
  că Formularul 230 a ajuns la ANAF.
- **Transferul bancar: donatorul bifează, asociația confirmă.** Transferul nu
  trece prin site, deci site-ul nu poate ști că s-a făcut: banii apar în
  extrasul de cont, pe care îl citește un om. Pe `/doneaza`, în cardul cu
  IBAN-uri, donatorul poate anunța că a făcut transferul (nume de pe transfer,
  sumă, zi, pentru ce). Anunțul intră în tabelul `donatii` cu starea
  `anuntata` și **nu se numără nicăieri** — toate interogările cer
  `stare = 'platita'` — pentru că vine dintr-un formular public: altfel oricine
  ar putea umfla raportul anual dintr-un browser. În panou, la `/admin/donatii`,
  apare sus, cu „Am găsit-o în extras" (devine donație, cu data scrisă de
  donator) și „N-am găsit-o". Numărul lor stă și în „De făcut acum".
  La anunț pleacă două mesaje — confirmarea către donator („îl căutăm în
  extras", nu o chitanță) și anunțul către asociație; mulțumirea adevărată
  pleacă abia la „Am găsit-o în extras", cu data scrisă de donator, nu cu
  ziua apăsării. La „N-am găsit-o" nu pleacă nimic, dinadins.
  Probă: `BAZA=http://localhost:3000 node scripts/qa/transfer-anuntat.mjs`
  (nu cere bază de date și nici parolă).
- **Donația lunară se oprește de către donator, din două locuri.** În contul
  lui (`/contul-meu`), lista abonamentelor active vine **de la Stripe**, nu
  din baza noastră: baza știe ce s-a plătit, nu ce e încă pornit, iar un
  panou care spune „ai o donație lunară" despre una oprită acum trei luni e
  mai rău decât niciun panou. Căutarea se face pe adresa de e-mail a
  clientului Stripe, deci prinde și abonamentele făcute prin GiveWP pe
  WordPress, dacă e același cont Stripe (acolo lipsește eticheta destinației,
  deci scrie „pentru asociație").
  Al doilea loc e **vestea de dinaintea reînnoirii**: cu câteva zile înainte
  de fiecare plată lunară pleacă un mesaj — cine rămâne n-are nimic de făcut,
  cine vrea să oprească are butonul chiar în mesaj. Se trimite pe evenimentul
  `invoice.upcoming` de la Stripe, nu dintr-o treabă programată de noi: el
  știe data fiecărei reînnoiri și îl trimite o dată pe factură. **Câte zile
  înainte se alege din contul Stripe** (Billing → Subscriptions and emails →
  „Upcoming invoice"); implicit sunt 3, pentru două zile se schimbă acolo.
  De ce mesajul: un om care vede pe extras o sumă pe care n-o mai ținea minte
  o contestă la bancă — comision, rată de acceptare stricată pentru toți, și
  tot se oprește donația, dar cu un om supărat la capăt.
  Linkul din mesaj **nu oprește nimic când e deschis**: duce la
  `/opreste-donatia`, o pagină cu un buton, iar oprirea se face prin POST.
  Scanerele de e-mail ale firmelor deschid din reflex toate adresele dintr-un
  mesaj; pe GET, donațiile s-ar fi oprit singure. Semnătura din link acoperă
  identificatorul abonamentului și ziua expirării (35 de zile), deci nu se
  poate schimba abonamentul din ea și nu ține o viață.
  Probă: `BAZA=… PAROLA_ADMIN=… SECRET_SESIUNE=… node scripts/qa/oprire-lunara.mjs`.
- **Plata lunară care nu trece se recuperează, nu se pierde tăcut.** Un card
  expiră, o bancă îl reemite, plata cade; Stripe mai încearcă de câteva ori și
  apoi oprește abonamentul. Donatorul nu știe — pentru el donația pare că
  merge — iar asociația află peste luni, din raport, că „a scăzut ce vine
  lunar". Pe `invoice.payment_failed`: rândul intră în `plati_esuate` (cheia e
  **factura**, nu abonamentul, deci reîncercările se numără, nu se dublează),
  donatorul primește **un singur mesaj pe factură** cu un link de schimbat
  cardul, iar asociația primește anunțul — jumătate dintre oameni nu deschid
  e-mailul, și pentru ei rămâne doar telefonul. Rândurile se văd la
  `/admin/donatii`, sus, și numărul lor în „De făcut acum". Când plata trece
  (`invoice.paid`), rândurile abonamentului se închid singure.
  **Mesajul nu ceartă pe nimeni:** omul nu datorează nimic, face o donație, iar
  dacă nu mai vrea să continue n-are nimic de făcut. Unul fugărit nu se mai
  întoarce.
  Linkul duce la `/actualizeaza-cardul`, care cere **atunci** o sesiune de
  portal Stripe — cele puse în e-mail expiră în câteva minute. Semnătura
  acoperă clientul și ziua expirării (35 de zile, `src/lib/card-nou.ts`); dacă
  portalul nu e pornit în contul asociației, omul primește o pagină cu telefon,
  nu o eroare. Probă:
  `PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/plata-esuata.mjs`
- **Căile de plată se văd toate din capul formularului de card**: „Card",
  „PayPal (în euro)" dacă are chei, „Transfer bancar". Înainte pagina începea
  direct cu formularul de card, iar celelalte stăteau după o cotitură de
  pagină — cine nu voia cu cardul nu afla de acolo că se poate și altfel.
- **Buletinele și campaniile de e-mail se trimit din MailerLite**, nu din
  panou. Pagina care încerca să fie un instrument de e-mail a fost scoasă:
  trecea pe lângă tot ce face unul adevărat — șabloane, segmente, probe,
  statistici de deschidere. În bara din stânga e un link către el.
- **`/admin/sabloane`** nu reface acel instrument: ține cele **două șabloane
  de campanie**, unul pentru persoane fizice și unul pentru firme. Ce nu se
  face bine în editorul MailerLite sunt tocmai butoanele — un e-mail către
  oameni are nevoie de zece-douăsprezece căi de a ajuta (card, 20/50/100 lei,
  lunar, 3,5%, SMS, transfer cu toate conturile, ziua ta, voluntariat,
  Galantom, distribuire), iar unul către firme de altele patru (calculatorul,
  contractul, Declarația 177, omul de la fundraising). Construite de mână la
  fiecare campanie, ies de fiecare dată altfel și lipsește câte unul.
  Aici se scriu **titlul, textul și poza**; restul e scris o dată, în
  `src/lib/email/campanie-sabloane.ts`, și verificat o dată.
  Patru butoane: vezi cum arată, descarcă HTML-ul (pentru editorul de cod din
  MailerLite), trimite-ți o probă, fă ciorna în MailerLite. **Nu trimite nimic
  către listă** — asta rămâne un gest omenesc, făcut acolo.
  Linkurile poartă etichete UTM, deci Google Analytics arată singur ce a adus
  buletinul. Probă: `BAZA=… PAROLA_ADMIN=… node scripts/qa/sabloane-email.mjs`.

Publicul: **`/noutati`** și **`/campanii`**, cu paginile lor. Nu sunt în meniul
principal — caietul îl fixează la nouă intrări (12.1), iar a zecea rupe antetul
la orice lățime peste 1300 px — ci în subsol.

Textele stau în tabelul `texte`, nu în cod. Probe:
`BAZA=… PAROLA_ADMIN=… node scripts/qa/scrie-pe-site.mjs` și
`… node scripts/qa/panou-fundraising.mjs`.

## O poză de telefon rupea formularele din panou

Pe 4 noiembrie 2026 fundraiserul a pus o poză pe un șablon de e-mail și a
primit „Cerere invalidă”, la „Vezi cum arată” și la „Trimite o probă”. În
jurnalul Railway scria adevărul: „Request body exceeded 10MB for
/api/admin/sablon”. Cu `proxy.ts` pe toate căile, Next taie corpul cererii
la 10 MB **în tăcere**: formularul ajunge rupt, `formData()` cade, iar omul
citește că a greșit el ceva. Probele n-au prins-o: trimiteau poze de 4 KB.

Trei apărări, în ordinea în care lucrează:

- **Pozele se micșorează în browser** (`componente/admin/MicsoreazaPoza.tsx`,
  montată o dată în `admin/layout.tsx`, ascultă toate câmpurile de fișier din
  panou): orice fotografie peste 1,5 MB se redesenează la cel mult 2.000 px
  și pleacă JPEG (PNG rămâne PNG), cu orientarea din EXIF păstrată; sub câmp
  scrie de la cât la cât. O poză de telefon de 12 MB ajunge la câteva sute
  de KB. PDF și SVG trec neatinse. `data-fara-micsorare` pe un câmp o oprește.
- **Limita lui Next e 30 MB** (`experimental.proxyClientMaxBodySize` în
  `next.config.ts`), peste orice fișier legitim: contractele PDF, cele trei
  atașamente de presă.
- **Rutele din panou citesc formularul prin `formularAdmin()`** (`lib/api.ts`):
  peste limită, 413 cu mărimea și limita scrise; dacă tot nu se poate citi,
  un mesaj care spune că fișierul e probabil prea mare — niciodată „Cerere
  invalidă”.

În aceeași zi, poza aleasă apărea **ruptă în previzualizarea de lângă
formular**: cadrul primea o adresă `blob:` care se revoca și se refăcea la
fiecare literă scrisă. Acum spre server pleacă doar un semn de loc, iar în
HTML-ul primit semnul devine poza scrisă în pagină (`data:`), după ce a fost
micșorată; `MicsoreazaPoza` trimite un `change` după înlocuire, ca
previzualizarea să se redeseneze cu poza mică.

**Greșeala care se vedea numai pe site** (a treia încercare a fundraiserului):
previzualizarea scrie relativ adresele `https://teona-ariana.ro/` din HTML,
pentru CSP; regula tăia domeniul și din semnul de loc
`blob:https://teona-ariana.ro/…`, iar poza aleasă rămânea ruptă. Pe localhost
semnul n-are domeniul, deci probele treceau. Acum înlocuirile stau într-o
funcție pură, `htmlPentruCadru` (`lib/poza-browser.ts`): întâi semnul de loc
devine poza, apoi adresele site-ului devin relative, cu `(?<!blob:)`; proba o
încearcă direct, cu adresa de pe site. **Tot ce depinde de domeniul paginii
se probează cu domeniul adevărat, nu cu localhost.** Tipul pozei se citește
din primii octeți (`tipulPozei`), nu din `File.type`, care pe Windows poate fi
gol.

Probă, cu o „poză de telefon” de 19 MB făcută cu sharp, în browser (inclusiv
cadrul de previzualizare), direct la rută și pe funcția cu adresa de pe site:
`BAZA=… PAROLA_ADMIN=… node scripts/qa/poza-mare.mjs` — 11 verificări.

## Auditul adversarial din 4 noiembrie 2026

După a treia defecțiune văzută de fundraiser și nu de probe, cinci agenți au
căutat în paralel **restul** defectelor de aceeași formă: cod care merge pe
localhost și cade în condițiile adevărate (Railway, Windows, poze de telefon,
scanere de e-mail, variabile scrise greșit). Fiecare a trebuit să **ruleze**
defectul, nu să-l citească. Ce s-a reparat, cu lecția fiecăruia:

- **Câmpurile goale plecau la listă ca text de exemplu.** La „probă”,
  „ciornă” și „trimite”, un șablon fără titlu sau text pleca cu „Titlul
  campaniei — îl scrii tu” — „Sorem ipsum”, din nou. Un titlu peste 160 de
  semne devenea exemplul **în tăcere**. Acum `ratat=gol` / `ratat=titlu-lung`;
  exemplul rămâne numai pentru „vezi” și „descarcă”.
- **Tipul fișierului se citește din octeți și pe server** (`tipDinOcteti`
  din `lib/poza-urcata.ts`), nu din `File.type`: pe Windows eticheta e des
  goală, iar un JPEG adevărat primea „nu e o fotografie”. Sigla SVG la fel
  (`pareSvg` se uită în text). Atașamentele de presă se verifică după
  conținut (JPEG/PNG/WebP, `%PDF`, `PK`), nu după extensie. La șablon, tipul
  se verifică **înaintea** mărimii: un HEIC de 8 MB primea „micșoreaz-o”.
- **HEIC de pe iPhone se spune pe față** în browser (`MicsoreazaPoza`), nu
  ajunge la server ca „prea mare”; un PNG micșorat peste 4 MB pleacă JPEG;
  nota de sub câmp se șterge când poza nouă n-a avut nevoie de nimic.
- **Sesiunea expirată dă o pagină cu „Înapoi”** (`sesiuneExpirata()` din
  `lib/api.ts`, 403), nu `{"mesaj":"Nu ai acces."}`: omul a lăsat fila
  deschisă ore, a scris, a apăsat — textul lui e tot în formular.
- **Toate rutele din panou citesc formularul prin `formularAdmin()`**; nicio
  rută nu mai scrie „Cerere invalidă.” de mână.
- **`ADRESA_SITE` se validează** (`seo.tsx`): scrisă „teona-ariana.ro”, fără
  schemă, `new URL()` din `metadataBase` arunca în mijlocul fluxului și
  jumătate din pagini plecau cu corp gol și **cod 200** — `/admin` nu se mai
  deschidea. Implicitul e acum `https://teona-ariana.ro`, **fără `www`**:
  aceeași gazdă spre care `proxy.ts` mută `www.` cu 308; cu `www` implicit,
  ștearsă variabila, fiecare canonică și sitemap-ul ar fi arătat spre o
  adresă care redirecționează. Paginile pregenerate o îngheață la build, deci
  o schimbare în Railway cere o publicare, nu un „Redeploy”.
- **`trimiteLa` curăță destinația**: un `inapoi` cu rând nou sau `?cauta=Ștefan`
  dădea 500 **după** ce salvarea se făcuse — omul credea că nu s-a salvat.
- **Filtrul anti-CSRF nu mai crede `host`** când există `x-forwarded-host`:
  pe Railway `host` e `localhost:8080`, deci `Origin: https://localhost:8080`
  trecea.
- **Linkul de intrare în cont și cel de schimbat cardul nu mai fac nimic la
  deschidere**: pagină cu buton, consumarea jetonului / sesiunea de portal
  Stripe se fac prin POST (`/api/cont/intra`, `/api/cont/card`). Scanerele
  de e-mail ale firmelor (Safe Links, Mimecast) deschid toate adresele
  înaintea omului: jetonul se consuma în scaner, omul vedea „linkul a
  expirat”, iar portalul Stripe se deschidea autentificat într-un robot.
  Aceeași regulă ca la `/opreste-donatia`, acum **peste tot**.
- Mărunte: cookie-ul de cont se șterge cu aceleași opțiuni cu care se pune;
  `verificaInainte` nu mai așteaptă 4 secunde la fiecare deschidere a
  panoului când o verificare e deja în curs; previzualizarea șablonului
  spune lângă titlu când a primit 429, în loc să rămână pe varianta veche.

Din rapoartele „erori”, „mediu” și „browser”, aceeași zi:

- **Variabilele din Railway se citesc curățate** (`mediu()` din
  `lib/mediu.ts`): `STRIPE_WEBHOOK_SECRET` lipit cu un spațiu la capăt
  respingea **toate** anunțurile de plată, `STRIPE_SECRET_KEY` cu rând nou
  oprea donațiile cu cardul, `PAROLA_ADMIN` cu spațiu închidea panoul — nimic
  în jurnal. `fetch` curăță singur antetele, deci cheile care merg prin HTTP
  mergeau; tocmai de aceea nu se vedea. `PAYPAL_MOD` acceptă „Live”.
- **Stripe și PayPal au limită de timp** (15 s): fără ea, SDK-ul Stripe
  aștepta 80 s × 3 — donatorul stătea patru minute pe „Se trimite…”, iar
  contul lui se deschidea în patru minute **fără** donația lunară, deci n-o
  putea opri. Acum contul spune pe față când Stripe n-a răspuns.
- **Contul donatorului nu mai minte despre buletin**: cu MailerLite căzut,
  „Gata, nu mai primești buletinul” se scria oricum, iar omul rămânea pe
  listă; ștergerea datelor ștergea din baza noastră și îl lăsa în MailerLite.
  Acum rezultatul se verifică; la ștergere, dacă lista nu răspunde, **nu se
  șterge nimic**. `daJosDinBuletin` citește `MAILERLITE_API` ca restul.
- **Pana bazei de date se spune, nu se ascunde**: la intrare,
  `?gresit=baza` („nu e parola ta”) în loc de „parolă greșită”; listele din
  panou (sponsori, cifre, texte, testimoniale, conturi) arată `BazaCazuta`,
  nu „niciunul încă”; rutele care scriu (`cuBaza()` din `lib/api.ts`)
  răspund 503 cu „apasă Înapoi, ce ai scris e tot acolo”, nu pagina albă a
  browserului. `intreaba()` scrie un rând în jurnal la orice interogare
  picată și semnează eroarea (`dinBaza`), ca un bug să rămână 500.
- **„Ți-am trimis pe e-mail” numai dacă a plecat**: Formularul 230 scrie
  pașii în răspuns când e-mailul cade; transferul anunțat la fel; contactul
  intrat în CRM nu-l mai trimite pe om să scrie a doua oară (ar apărea de
  două ori în panou); campania aniversară hotărâtă fără e-mail o spune în
  panou, cu adresa, ca să-i trimită cineva linkul.
- **Proba șablonului care n-a plecat e un eșec**, în roșu, fără „verifică
  adresa și cheia Resend” (cauza era rețeaua, nu omul). Consultantul,
  asistentul și analiza scriu în jurnal codul primit de la API.
- **Taberele din panou nu mai dispar o oră după publicare**: `dinPanou()` și
  `sitemap.ts` țineau lista goală de la build (Railway construiește fără
  bază) — `/proiecte` fără tabăra nouă, pagina ei 404. Acum `cacheRezerva()`,
  ca la cifre și sponsori. La fel documentele: R2 mut la build nu mai lasă
  butoanele inactive cinci minute.
- **Aplicația instalată are raza `/admin`, fără bară**: cu `/admin/`, Chrome
  ignora raza (pagina de început `/admin` nu era în ea), aplicația înghițea
  tot site-ul, iar „Primește notificări aici” rămânea pe „Se pornește…”
  pentru totdeauna — `serviceWorker.ready` nu se rezolvă pe o pagină din
  afara razei. Raza deasupra fișierului cere antetul `Service-Worker-Allowed`.
  Cloudflare ține `/admin/sw.js` 4 ore (e „static” după extensie); o regulă
  de „Bypass” pe `/admin/*` în Cloudflare ar grăbi orice reparație viitoare.
- **CSP lasă playerul Facebook** în cadru: „Vezi filmarea” de pe „Suntem în
  presă” deschidea un dreptunghi gol.
- **Ce scrie omul în panou rămâne în filă** (`TineCiorna`, în
  `sessionStorage`, 12 ore, șters la o salvare reușită): după sesiunea
  expirată, „Înapoi” reîncărca formularul de intrare și textul nu mai era
  nicăieri. Toate rutele din panou răspund acum cu `sesiuneExpirata()`.
  Exportul pentru Excel n-are `download` pe link: un răspuns „intră din nou”
  apărea ca o descărcare eșuată, fără mesaj.
- **`/admin/documente` pe telefon** nu mai derulează orizontal (`min-w-0` pe
  câmpul de fișier). **`/doneaza-ti-ziua`** hotărăște la cerere dacă are
  asistent (un build fără cheie dădea eroarea React #418 la fiecare
  vizitator); poza de aniversare se recunoaște după octeți și se micșorează
  în browser; fără JavaScript, formularul reîncarcă pagina, nu arată `{}`.
- La pornire, `instrumentation.ts` strigă în jurnal un `SECRET_SESIUNE` sub
  32 de semne (conturile nu pot intra, e-mailurile pleacă fără buton) și un
  `ADRESA_SITE` fără schemă.

**Ce a mers și e acoperit** (nu s-a schimbat): toate cele 33 de rute POST
din `/api/admin` dau `Location` relativ sub `Host: localhost:8080`;
cookie-urile au `Secure; HttpOnly` și expirarea în semnătură; `www.` și
`….up.railway.app` se mută numai pe GET/HEAD în afara lui `/api`; Origin
străin → 403; limita de rată se numără pe `x-real-ip`/`cf-connecting-ip`;
404 adevărat pe sluguri inexistente; PayPal aprobat de două ori + captură +
pagina de mulțumire = **o** donație, **o** mulțumire; 31 MB → 413 cu mesaj.
**Ce nu se poate verifica de aici**: limita de rată pe site-ul viu (proxy-ul
acestui mediu iese din mai multe adrese), dacă Railway reconstruiește la
schimbarea unei variabile, un iPhone adevărat.

**Ce rămâne nereparat, dinadins sau pe mai târziu**: linkul de intrare în
cont răspunde la fel și când e-mailul n-a plecat (altfel ar trăda ce adrese
au donat); `ADAOSURI` din `baza.ts` pleacă tot într-o singură cerere (un
rând stricat lasă tot blocul necreat — nu e niciun defect activ, dar jurnalul
spune acum care instrucțiune a picat); `localStorage` blocat lasă bannerul
de cookie-uri pe loc; contactul fără JavaScript trimite datele prin GET.

**Probele auditorilor** sunt în `scripts/qa/audit-<zona>-*.mjs`; `fetch`
din Node **ignoră `Host:`** — ce vrea să imite Railway folosește `node:http`
sau `curl`.

## Site-ul nu face campanii de e-mail

Asociația a fost oprită odată de Railway pentru e-mailuri trimise în masă.
De atunci regula e: **campaniile către liste pleacă numai din MailerLite**, de
pe serverele lor. Panoul face doar ciorna acolo (`creeazaCiorna`) și, la
cerere, îi spune lui MailerLite s-o trimită (`trimiteCampania`).

Site-ul n-are server de e-mail și nu folosește SMTP; trimite prin API-ul
Resend, și numai:

- **mesaje către un om anume** (mulțumiri, confirmări, anunțuri către
  asociație) — fără limită, o mulțumire nu se oprește niciodată;
- **trei trimiteri mici, făcute de un om din panou**, marcate `masa: true`:
  comunicatul de presă (câteva redacții), apelul către voluntari (cel mult
  50 pe e-mail) și proba unui șablon (cel mult 10). Peste toate, `LIMITA_MASA`
  din `lib/email/trimite.ts`: **150 pe oră**, după care `trimiteEmail` refuză
  și scrie în jurnal.

Încărcarea de abonați din panou **nu trimite nimic**: o listă de 200 de
adrese ar fi însemnat 200 de mesaje din serverul de pe Railway. Un bun venit
pentru cei încărcați se face ca automatizare în MailerLite.

**Nu adăuga o trimitere către o listă de oameni din cod.** Dacă e nevoie de
una, adresele intră într-un grup MailerLite și mesajul pleacă de acolo.

## Mesajele automate: un singur plic

Toate e-mailurile tranzacționale — mulțumiri, confirmări, pașii fiscali,
contractul, intrarea în cont, anunțurile către asociație — trec prin
`pagina()` din `src/lib/email/plic.ts`: bandă portocalie cu siglă sus,
corpul, rețelele, apoi datele asociației (denumire legală, CIF, Casa Teona,
amândouă telefoanele, e-mailul). Se schimbă o dată pentru toate: un telefon
nou nu se mai uită într-un fișier.

- **Nicio dezabonare.** De la o chitanță nu te dezabonezi, iar un link de
  dezabonare pe un mesaj tranzacțional îi învață pe oameni să se dezaboneze
  de la confirmări. Campaniile din MailerLite au alt plic
  (`campanie-sabloane.ts`), cu dezabonare, cum cere legea și MailerLite.
- **`paginaInterna()`** e același plic pentru mesajele către asociație.
  Diferă un singur rând, cel de jos: „Primești mesajul ăsta pentru că ai
  scris sau ai donat pe…" e adevărat despre un donator și fals despre adresa
  de contact. Un rând care minte într-un mesaj automat e felul în care nimeni
  nu mai citește rândurile mărunte.
- **Rândul de previzualizare** (al treilea argument) e ce arată Gmail în listă
  după subiect. Fără el, clientul ia primele cuvinte din mesaj — adică
  antetul, adică numele asociației, care scrie deja la expeditor.
- Regulile de randare: tabele pentru așezare, stiluri în linie, 600 px,
  butoanele din celule cu `bgcolor` (Outlook randează cu motorul Word și
  ignoră fundalul unui `<a>`; Gmail taie `<style>` din `<head>`).
- Toate se văd la **`/admin/emailuri`**, compuse cu date de probă.

## Fotografiile se comprimă la 86, nu la 75

Next comprimă implicit la calitate 75. Pentru un site în care fotografia e
conținutul, 75 în WebP netezește tocmai detaliul care contează — firele de
păr, textura hainelor, ochii — iar pe ecranele dese se vede ca o ceață fină
peste toată pagina. Fotografiile de conținut cer acum **86** (vreo 40% mai
mulți octeți pe cele mari); siglele și pictogramele rămân la 75.

Lista calităților permise se scrie în `next.config.ts` (`images.qualities`):
din Next 15.4 o calitate necerută explicit e refuzată, ca să nu poată cineva
cere 100 pentru fiecare poză dintr-o adresă și să încarce serverul.

**Rezoluția era deja bună; compresia nu.** Măsurat pe fir — octeții primiți
de browser față de ce cere un ecran la densitate dublă — din 56 de
fotografii de pe paginile principale doar 7 sunt chiar sub rezoluție, și
acelea fiindcă originalul moștenit de pe Facebook e mic (vezi „Ce lipsește
de la client"). `naturalWidth` **nu** e bun la măsurătoarea asta: la
`srcset` cu descriptori `w`, browserul îl corectează cu densitatea, deci
arată mărimea în pixeli CSS, nu pixelii primiți.

## Asistentul de pe site

Caseta „Întreabă-ne", jos în pagină, răspunde vizitatorilor: cum se donează,
ce e Casa Teona, cum sponsorizează o firmă, cum se devine voluntar.

- **Știe numai ce scrie în `src/lib/intreaba/stiinta.ts`** — aceleași constante
  verificate din care se scriu paginile, contractele și e-mailurile. Nu citește
  site-ul vechi: acolo au rămas pagini de magazin din WordPress și tabere de
  acum trei ani descrise la prezent. Dacă un IBAN se schimbă, se schimbă
  peste tot deodată, inclusiv în ce spune asistentul.
- **N-are acces la baza de date.** Nu știe cine a donat, cât s-a strâns, cine e
  pe vreo listă. E omul de la recepție care știe bine casa, nu unul cu chei la
  toate ușile.
- **Nu promite nimic** în numele asociației: nu confirmă un loc în tabără, nu
  acceptă cereri, nu stabilește întâlniri. Pentru toate astea trimite la
  formularul potrivit sau la telefon.
- **Nu cere date personale și nu salvează nimic.** Conversația trăiește în fila
  omului. Într-o casetă în care oamenii scriu uneori despre boala copilului, a
  nu ține nimic e singura purtare cuviincioasă.
- Capăt public care cheamă un API plătit: 20 de întrebări pe oră pe adresă,
  întrebarea cel mult 600 de semne (mai lungă e refuzată, nu tăiată),
  conversația șase schimburi, răspunsul plafonat. Partea care nu se schimbă —
  regulile și ce știe asociația — se păstrează în cache-ul API-ului, deci a
  doua întrebare costă a zecea parte din prima.
- Pe telefon caseta stă jos-stânga: jos-dreapta e butonul plutitor „Donează",
  iar două butoane rotunde unul peste altul se apasă din greșeală.
- Modelul se schimbă dintr-o variabilă, `MODEL_ASISTENT`; implicit
  `claude-opus-5-5`. Codul nou folosește SDK-ul oficial (`@anthropic-ai/sdk`);
  `src/lib/asistent.ts` și `src/lib/analiza/intreaba.ts` au rămas pe `fetch`
  scris de mână, cu `claude-sonnet-5-5`.
- Probă, cu un API de mentiune care citește ce i se trimite:
  `node scripts/qa/intreaba.mjs` — verifică și că în cerere ajung datele
  verificate, și că nu ajunge nimic din baza de date.

## Formularul 230 pe hârtie: site-ul nu ține niciun CNP

Cine preferă pixul descarcă formularul de la `/formular-230`, îl completează,
trimite **poza pe WhatsApp sau pe e-mail** direct la asociație, hârtia semnată
prin poștă, și spune pe site că a completat.

- **Site-ul nu primește poza.** A existat și varianta cu fișier urcat în
  depozit privat; s-a scos pentru că nu rezolva nimic — oamenii trimit poza pe
  WhatsApp oricum, iar o a doua copie n-ar fi scos-o pe prima din telefon,
  doar ar fi adăugat încă un loc în care stă același CNP.
- **Anunțul intră în CRM**, ca o cerere cu felul `redirectionare` — acolo unde
  scrie și formularul de pași de pe aceeași pagină. O singură listă, un singur
  export, o singură căutare. Se vede și la `/admin/cereri`, și la
  `/admin/formulare`, care adaugă legătura de WhatsApp și eticheta „2 ani".
- **„Pe câți ani"** se întreabă pentru că formularul are opțiunea de
  distribuire pe doi ani: cine a bifat-o nu mai trebuie căutat la anul.
- **După anunț pleacă un e-mail** cu ce i-a mai rămas de făcut — poza pe
  WhatsApp și hârtia semnată prin poștă, cu adresa Casei Teona —, pentru că
  nimeni nu i le mai amintește și termenul e 25 mai. Nu confirmă că am primit
  formularul: nu l-am primit. Că a ajuns la ANAF scrie un om, nu site-ul.
- **R2 rămâne doar pentru fișierul 230 gol**, cel pe care îl descarcă oamenii.
  N-are nicio dată personală în el. Chei în Railway: `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, plus `R2_ENDPOINT`
  dacă depozitul e în jurisdicția UE. Semnătura AWS v4 e scrisă de mână; probă:
  `node scripts/qa/semnatura-r2.mjs`.
- Numărul de WhatsApp de pe pagină e cel public al asociației. Un număr
  personal al cuiva din echipă n-are ce căuta acolo fără acordul lui scris.

## Adresele inexistente răspund 404, nu 200

`/proiecte/<slug care nu există>` răspundea cu **codul 200** și pagina „nu a
fost găsită” în corp — un „soft 404”, pe care Google îl indexează ca pagină
adevărată. Cauza e randarea parțială: antetul pleacă spre browser înainte ca
pagina să ajungă la `notFound()`.

Trei remedii nu merg cu `cacheComponents` pornit, toate încercate:
`dynamicParams = false` (Next o refuză explicit), `notFound()` mutat în
`generateMetadata`, și `NextResponse.rewrite(…, { status: 404 })` (ignoră
codul). Ce merge e în `src/proxy.ts`: filtrează slugurile înainte de randare
și întoarce corpul paginii `/proiect-inexistent` cu codul 404.

Proba: `BAZA=http://localhost:3000 node scripts/qa/coduri-404.mjs`.

## Pe Railway, adresa cererii e `localhost:8080`, nu site-ul

Clientul a scris în octombrie 2026: „de ce nu reacționează butonul? nu se
întâmplă nimic; dacă dau refresh, arată” — la intrarea în panou și la
conturi. Prima explicație (mesajul de confirmare rămânea în capul paginii,
nevăzut) era adevărată, dar nu era cauza. Cauza: `NextResponse.redirect(new
URL(cale, cerere.url))` scrie un `Location` absolut, din adresa cererii, iar
în spatele proxy-ului Railway adresa cererii e `https://localhost:8080/…`.
Browserul primea „du-te la localhost:8080”, refuza, și rămânea pe loc, fără
niciun semn. **Formularul se salva.** De aceea la refresh apărea.

- **Nicio probă n-a prins-o.** Local, adresa cererii chiar e cea din browser,
  deci toate redirecționările mergeau. A prins-o un `curl -D -` pe site-ul
  publicat: `location: https://localhost:8080/admin/sponsori?stare=schimbat`.
  Un `303` pe care curl îl urmează fericit și browserul nu.
- **Toate redirecționările trec prin `trimiteLa()`** (`src/lib/api.ts`), cu
  `Location` **relativ**, pe care browserul îl rezolvă singur față de adresa
  pe care a trimis formularul. Se construiește de mână:
  `NextResponse.redirect()` refuză adresele relative. Singura rămasă pe
  `NextResponse.redirect` e cea spre linkul de plată Revolut, o adresă din
  afară — acolo așa trebuie.
- **Nici `new URL(cerere.url).origin` nu e site-ul.** Linkul de dezabonare din
  șablonul de campanie se construia așa și ar fi plecat în e-mailuri ca
  `https://localhost:8080/politica-de-confidentialitate`. Adresa site-ului e
  `ADRESA_SITE` din `src/app/seo.tsx`, de acolo o iau și Stripe, și
  e-mailurile.
- Verificare locală care imită Railway:
  `curl -D - -H "Host: localhost:8080" -X POST …/api/admin/intrare -d …` —
  `Location` trebuie să înceapă cu `/`.

## Railway construiește cu baza de date pusă, dar nu accesibilă

`DATABASE_URL` există în timpul build-ului, deci `areBazaDeDate()` spune „da".
Dar rețeaua privată a Railway **nu răspunde la build**: `postgres.railway.internal`
nici nu se rezolvă. Deci orice citire din baza de date făcută la pregenerarea
unei pagini cade — de fiecare dată, la fiecare publicare, nu din când în când.

Și cade **tot build-ul**: Next numără eroarea ca eroare de pregenerare și se
oprește („Export encountered an error on /page: /, exiting the build").

S-a întâmplat în octombrie 2026, de două ori la rând, la testimonialele de pe
prima pagină. Local trecea, fiindcă local `DATABASE_URL` arăta spre un Postgres
care răspunde — adică exact situația pe care Railway n-o are.

- **O eroare aruncată dintr-o funcție cu `"use cache"` nu se mai poate prinde
  din afară.** Cu `cacheComponents`, un `.catch()` pe apel arată că acoperă
  cazul și nu acoperă nimic. Prinderea stă **înăuntru**, în jurul citirii:
  `return citesteActive().catch(() => []);`. Așa e scris și `dinPanou()` din
  `date/proiecte.ts`, și de aceea el n-a căzut niciodată.
- **Degradarea e în regulă, oprirea build-ului nu.** Prinsă, pagina se
  construiește cu ce are la îndemână (fișierul de sămânță), iar la prima
  reîmprospătare de la pornire — când baza răspunde — se umple cu ce e în
  panou. Eticheta de cache o golește oricum la prima salvare din panou.
- **Proba adevărată nu e `npm run build`**, e:
  `DATABASE_URL="postgres://postgres:x@postgres.railway.internal:5432/railway" npm run build`
  Asta reproduce build-ul de pe Railway în câteva secunde. Orice pagină
  pregenerată care atinge baza se verifică așa **înainte** de publicare.
- **Jurnalul de build spune adevărul**, nu doar cel de rulare: o publicare
  „FAILED" nu schimbă nimic pe site, deci site-ul rămâne la versiunea veche
  și arată perfect sănătos. Un `git push` care a mers nu înseamnă o publicare
  care a mers — se verifică starea publicării, nu starea depozitului.

## Schema pleacă într-o singură cerere, deci cade în întregime

`DEFINITIE` din `src/lib/baza.ts` e un bloc mare de SQL trimis ca o singură
cerere. Postgres îl rulează într-o tranzacție implicită: **o greșeală la orice
rând dă rollback la tot**, iar lanțul din `pregateste()` nu mai ajunge la
`ADAOSURI`. Cum fiecare `intreaba()` așteaptă schema, o singură instrucțiune
stricată face ca **orice** pagină care atinge baza să răspundă 500 — nu doar
cea la care te-ai aștepta.

S-a întâmplat în octombrie 2026, și panoul a stat căzut două zile. Semnatul
contractului pe ecran fusese scos din site, dar tabelul lui, `contracte`,
rămăsese în baza de date, cu alte coloane. Registrul de contracte a adus un
tabel cu același nume, scris cu `CREATE TABLE IF NOT EXISTS` — care a văzut
unul existent și n-a făcut nimic. Imediat sub el, `CREATE INDEX … (an DESC)`
a cerut o coloană care nu există în tabelul vechi: „column «an» does not
exist”. De acolo în jos n-a mai fost creat nimic: nici `plati_esuate`, nici
coloanele din `ADAOSURI`.

De reținut, pentru data viitoare:

- **`CREATE TABLE IF NOT EXISTS` nu e o migrare.** Nu se uită la coloane: dacă
  un tabel cu numele ăla există, din orice viață anterioară, instrucțiunea
  trece tăcut și abia ce vine după ea crapă.
- **Un tabel scos din cod nu dispare din baza de date.** Când o funcție e
  ștearsă, tabelul ei rămâne, iar numele lui rămâne ocupat.
- **Tabelele vechi nu se șterg, se mută deoparte.** Cel de aici ținea PDF-uri
  de contracte semnate, cu IP și amprentă. A devenit
  `contracte_semnate_pe_ecran`, printr-un `DO $$ … $$` care se uită după o
  coloană ce există numai în cel vechi și sare dacă mutarea s-a făcut deja.
- **Jurnalul Railway spune adevărul mai repede decât orice presupunere.**
  Eroarea era acolo, cu cod cu tot (42703, `ComputeIndexAttrs`), de două zile.

## Auditul de securitate din 29 octombrie 2026

Pornit de la o ofertă trimisă la grămadă („domeniul n-are DMARC") — care
avea dreptate. Scanerele care trimit oferte de felul ăsta citesc DNS-ul,
antetele, subdomeniile și versiunile afișate. Ce s-a găsit și ce s-a făcut:

- **`SECRET_SESIUNE` lipsea pe Railway**, deci tot ce semna site-ul (sesiuni,
  cookie-ul donatorului, linkurile din e-mail) era semnat cu `PAROLA_ADMIN`.
  Un donator își știe adresa și are cookie-ul semnat, deci putea ghici parola
  panoului offline, fără limită. Acum cheia e **numai** `SECRET_SESIUNE`
  (≥32 de semne, `src/lib/cheie-semnare.ts`); fără ea, funcțiile se opresc.
  Linkurile de oprire, card și invitație trimise înainte se mai **verifică**
  cu cheia veche până pe 5 decembrie 2026, ca să nu se strice în cutiile
  oamenilor; nimic nou nu se mai semnează cu ea.
- **Limitele de cereri se ocoleau** scriind alt `X-Forwarded-For` la fiecare
  cerere. Acum adresa vine din `X-Real-IP` (pus de Railway) și, numai când
  acela e o adresă Cloudflare, din `CF-Connecting-IP` (`adresaClient()` din
  `lib/api.ts`). Local, fără `X-Real-IP`, probele pot juca în continuare mai
  mulți oameni din `X-Forwarded-For`.
- **Cookie-urile au expirarea în semnătură**: și cel dat de parola
  asociației (`k:<expiră>:<semnătură>`, înainte era o valoare fixă, bună
  pentru totdeauna), și cel al donatorului (`email|expiră|semnătură`).
- **Corpurile cererilor publice se citesc cu limită** (`formularCuLimita`,
  `octetiCuLimita` din `lib/api.ts`): `formData()` citea oricât.
- **`src/proxy.ts` rulează acum pe toate căile**: trimite `www.` și adresa
  `….up.railway.app` la `teona-ariana.ro` (308), și refuză POST-urile din
  `/api` cu `Origin` străin (afară de webhook-uri și `/api/radar`).
- `next` 16.4.0 → **16.4.3** (două execuții de cod de la distanță, publice),
  `zod` actualizat. `npm audit` dă 0.
- `/.well-known/security.txt` cu adresa de contact.
- **SEO și viteză, în aceeași zi** (Lighthouse pe zece pagini, crawl pe tot
  sitemapul, cele 72 de adrese vechi din WordPress): accesibilitate și SEO
  100 peste tot. S-au reparat: `<title>` peste 60 de semne și descrieri peste
  155 (`metadate()` din `seo.tsx` le scurtează la cuvânt sau la propoziție;
  `<h1>`-ul rămâne întreg); scriptul de statistici pe care **Cloudflare îl
  lipește singur** în pagină era blocat de CSP și dădea eroare în consolă;
  caruselul de pe prima pagină pornește abia după primul gest (altfel fiecare
  poză nouă era „LCP” și Google măsura 6 secunde); Kalam nu se mai
  preîncarcă (patru fonturi întârziau fotografia din capul paginii); spațiu
  ascuns între „Asociația” și „Teona Ariana” în siglă, ca eticheta linkului
  să se potrivească cu textul.
- **Roboții de la formulare** (2 noiembrie 2026): o campanie de aniversare
  „jfqbwd”, cu nume „294486712744” și adresă de unică folosință, a ajuns la
  aprobare. Jurnalul HTTP al Railway arată de unde: zece încercări în patru
  zile, **toate prin Tor**, fiecare de la alt nod (capcana `site_web` le
  prinsese pe nouă), plus opt cereri aruncate în formularul de card — semnul
  obișnuit al testării cardurilor furate. Trei bariere, toate în
  `src/proxy.ts`, deci pentru **toate** formularele publice deodată:
  - **Tor nu trimite formulare** (`lib/tor.ts`, lista Tor Project,
    reîmprospătată din oră în oră; dacă lista nu vine, trece tot). Paginile
    se citesc normal; POST-ul primește 403 cu e-mailul asociației.
  - **Antetul `x-deschis`** (`lib/antet-om.ts`): fiecare formular îl pune la
    trimitere, din `performance.now()`. Fără el sau sub o secundă — un robot
    care lovește ruta direct — răspunsul e un `202 {}` gol, ca la capcană.
    **O probă care face `fetch` direct la o rută de formular trebuie să-l pună**,
    altfel primește 202 și pare că ruta nu mai scrie nimic.
  - **Textul trebuie să semene a text** (`pareText()` din `lib/api.ts`):
    titlul, numele și mesajul campaniei cer o vocală, iar mesajul trei cuvinte.
- **Redirecționarea `www.` a oprit plățile cu cardul** (3–4 noiembrie
  2026). Stripe anunță plățile la `www.teona-ariana.ro/api/donatii/stripe/webhook`;
  de când `www.` dădea 308, fiecare anunț a fost respins — webhook-urile nu
  urmează redirecționările. Banii intrau în Stripe, iar în panou nu apărea
  nimic; a observat-o fundraiserul, la o donație de probă. Acum `proxy.ts`
  mută pe adresa canonică **numai GET/HEAD în afara lui `/api`**. Tot atunci
  s-a adăugat anunțul către asociație la fiecare donație nouă cu cardul
  (`anuntaDonatia`, nu și la reînnoirile lunare) — înainte pleca doar
  mulțumirea către donator.
  Probă, pe tot drumul, cu anunțul trimis exact la `www.`:
  `PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/donatie-card.mjs`.
  **Orice schimbare în `proxy.ts` se probează și cu ea.**
- **Plățile nu mai depind de un singur anunț** (4 noiembrie 2026). Tot ce
  urmează unei încasări stă în `src/lib/plati/confirmare.ts`
  (`dupaIncasare`): mulțumirea la donator, „Donație nouă” la asociație,
  notificarea pe telefon, buletinul. Rândul vine din `marcheazaPlatita`,
  care îl întoarce **numai prima dată**, deci oricâte căi ajung la aceeași
  plată, nimic nu pleacă de două ori. Căile:
  - **Stripe**: webhook-ul (și `async_payment_succeeded`); pagina de
    mulțumire (`ConfirmaPlata` → `/api/donatii/confirma`, întreabă Stripe);
    panoul — `/admin` și `/admin/donatii` întreabă Stripe despre plățile
    rămase „inițiate” din ultimele 30 de zile (cel mult o dată la cinci
    minute, cel mult patru secunde). **Nu e niciun buton de apăsat**: un buton
    „verifică” lăsa impresia că plățile trebuie confirmate de mână. Dacă
    rândul „inițiat” lipsește, se scrie din metadatele sesiunii, nu se
    pierde plata.
  - **PayPal**: comanda trebuie **încasată** (capture). Până acum nu o
    încasa nimeni, deci nicio donație PayPal nu s-a luat vreodată. Se
    încasează din pagina de mulțumire (`token` din adresă) și din webhook-ul
    `CHECKOUT.ORDER.APPROVED`; referința e identificatorul încasării, același
    cu al lui `PAYMENT.CAPTURE.COMPLETED`.
  - **Transferul**: neschimbat — anunțul, apoi „Am găsit-o în extras”.
  **Notificări pe telefon** (`src/lib/notificari.ts`, web-push, cheile
  `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` în Railway): butonul e pe tabloul de
  bord; pe iPhone merg numai din aplicația instalată. Pleacă la donație nouă,
  transfer anunțat și contract făcut pe site; textul are doar prenumele și
  suma (apare pe ecranul blocat).
  Probă pe toate căile, cu Stripe, PayPal, Resend și serviciul de notificări
  de mențiune: `PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/plati.mjs`
  (35 de verificări; `STRIPE_API` și `PAYPAL_API` îndreaptă clienții spre
  mențiune, numai în probe). Notificările se pornesc **numai din conturile
  cu nume**: un telefon abonat cu parola asociației n-ar avea cui să-i fie
  oprit. Plățile abandonate (sesiune expirată la Stripe) trec pe `expirata`,
  ca verificarea să nu le mai întrebe. La PayPal, anunțul
  `PAYMENT.CAPTURE.COMPLETED` citește comanda, ca să aibă adresa donatorului.
- **Contul donatorului** (`/contul-meu`): fără parolă — omul își scrie
  adresa și primește un link de intrare care merge o dată. E-mailul de
  mulțumire are butonul „Vezi donațiile tale”, cu adresa deja completată
  (`?email=`); nu deschide contul direct, ca un e-mail retrimis să nu fie o
  cheie. În cont: totalul, donațiile, unde s-au dus banii, donațiile lunare
  (oprite de acolo) și **insignele** (`componente/cont/Insigne.tsx`) — numai
  din fapte știute: număr de donații, luni alături, donație lunară, lei
  dăruiți. **Nu „ai ajutat N copii”**: nu știm câți copii a ajutat o donație.
- **Asociația află de fiecare abonare la buletin** (4 noiembrie 2026). Toate
  căile — caseta de newsletter, bifa de la donație, contul de donator — trec
  prin `laBuletin()` (`lib/buletin.ts`), care scrie și un rând în
  `abonati_buletin` (cheia e adresa) și, **numai la o abonare nouă** sau la o
  reabonare după dezabonare, trimite „Abonat nou la buletin” la contact@ și o
  notificare pe telefon. În panou: `/admin/abonati`, cu sursa fiecăruia și
  numărul întregii liste din MailerLite (cei de dinainte de 4 noiembrie sunt
  numai acolo). Dezabonarea din cont pune `dezabonat_la`.
- **Două pagini la E-mail și promovare.** `/admin/abonati`: sus, cifrele
  **din MailerLite**, la fiecare deschidere (persoane fizice = grupul
  `MAILERLITE_GROUP_ID`, firme = `MAILERLITE_GROUP_FIRME`, total); dedesubt,
  „De unde au venit”, sursă × listă, din `abonati_buletin`, plus rândul „de
  dinainte de 4 noiembrie” = MailerLite minus ce știm noi; jos, lista, cu
  filtre. **Site-ul nu ține o copie a listei**, doar urma fiecărei abonări.
  `/admin/abonati/incarca` (drept separat în `PAGINI`) are formularul.
  **Lista de jos vine și din MailerLite** (`abonatiiGrupului`, pagină cu
  pagină): cei pe care site-ul nu i-a văzut venind apar cu sursa
  „mailerlite” și intră în rândul „de dinainte”. Fără asta, pe 4 noiembrie
  pagina scria sus „4 abonați” și jos „nicio abonare” — site-ul știa numai
  de abonările făcute prin el, de atunci încolo. Mențiunea din probă
  răspunde și la `/groups/<id>/subscribers`.
- **Adrese adăugate de mână, din panou** (`/admin/abonati/incarca`;
  `/api/admin/abonati`): una sau mai multe, despărțite prin virgulă,
  punct și virgulă sau rând nou, toate în lista aleasă (persoane fizice sau
  firme — dintr-o adresă nu se poate ști sigur care e). **Bifa de acord și
  „de unde aveți acordul” se cer și pe server**, iar nota stă lângă fiecare
  adresă, cu numele celui care a adăugat-o (`acord_nota`, `adaugat_de`).
  **Cine s-a dezabonat din MailerLite nu se pune înapoi**: fiecare adresă se
  întreabă întâi acolo (`stareaInMailerLite`), iar orice altă stare decât
  „active” o sare și o numește. Nu pleacă anunț „Abonat nou” (a adăugat-o chiar
  omul care l-ar primi) și **niciun e-mail către cei încărcați**. Cel mult 200 o dată.
  Probă: `PAROLA_ADMIN=… DATABASE_URL=… node scripts/qa/abonati-panou.mjs` — 21
  de verificări.
- **Anunțurile către asociație pleacă la două adrese** (`CATRE_ASOCIATIE` din
  `date/asociatie.ts`): contact@ și mihaela.sfichi@ (fundraising). Donație
  nouă, transfer anunțat, contact, voluntar, aniversare, plată eșuată, abonat
  nou — toate. Omul de pe rol se schimbă într-un singur loc.
- **Newsletterul trimite bun venit** (`src/lib/email/buletin.ts`). Abonarea
  merge prin API, cu starea „activ”, iar pe calea asta MailerLite nu trimite
  nimic; site-ul scria totuși „Verifică-ți emailul pentru a confirma” și
  fundraiserul a așteptat un e-mail care nu venea.
- **Ce nu ține de cod** (DNS în Cloudflare, găzduirea veche) e în raportul din
  conversație: `ftp.teona-ariana.ro` arăta `phpinfo()`, WordPress-ul vechi se
  vede pe `mail.teona-ariana.ro` cu GiveWP 3.18.0 (vulnerabilitate critică
  publică), lipsesc CAA, DNSSEC, MTA-STS.

## Auditul de logică din 11 noiembrie 2026

Asociația a publicat o tabără cu poză principală și galeria n-a apărut; proba
urcase pozele numai pe o ciornă **fără** poză principală. De aici regula:
**o funcție se probează pe combinațiile pe care le face omul, nu pe drumul pe
care l-am scris eu.** Cinci agenți au căutat restul defectelor de aceeași
formă, rulându-le. Reparate (lista întreagă e în istoricul depozitului):

- **Conținut.** Browserul trimite rândurile ca `\r\n`: paragrafele scrise
  din panou se lipeau (`split(/(?:\r?\n){2,}/)`, iar `text()` normalizează).
  Textul din panou se pune **peste** tabăra veche (`peste()` din
  `date/proiecte.ts`), câmp cu câmp: data, categoria și folderul trec numai
  dacă au fost scrise (`areDataScrisa`, `areCategorieScrisa`). O tabără nouă
  nu ia slugul uneia din cod. „Salvează ciorna” pe un text publicat se cheamă
  „Scoate de pe site” și nu-i mai șterge data publicării.
- **Bani.** Reînnoirea lunară nu mai cheamă `laBuletin` (reabona pe cine se
  dezabonase). „Vine lunar” ia ultima plată a fiecăruia. Transferul respins
  și anunțat din nou se redeschide; destinația intră în referință. Linkul de
  pe pagina „de ziua ta” poartă `frecventa=o-data`. O pană Stripe răspunde
  500, nu 503 (503 înseamnă „plata nu e pornită”). Abonamentele `past_due`
  se văd și se opresc din cont.
- **Firme.** Totalul registrului și „au sponsorizat înainte” numără numai
  `semnat` și `incasat`. O firmă pe „A renunțat”, sau încasată într-un an
  trecut, care scrie din nou devine „Cerere nouă”. `normalizeazaCui` scoate
  și punctele și liniuțele. `pasulUrmatorSponsorizare()` (`date/formulare.ts`)
  scrie o dată ce urmează, după calea aleasă: ecran, e-mail, anunț intern.
  `cautaFirma` aruncă `AnafMut` când ANAF tace, în loc să țină o zi „nu
  există”. Calculatorul șterge cifrele firmei de dinainte.
- **Cheia de probă** lucrează numai pe rândurile cu adresa de probă
  (`probaAreVoie` din `lib/proba.ts`) și nu mai confirmă plățile oamenilor
  când deschide panoul (`verificaInainte`).

**Al treilea lot, aceeași zi:**

- **Rambursările** (`charge.refunded` în webhook-ul Stripe): donația trece pe
  `rambursata` și iese singură din toate socotelile; parțială, rămâne cu suma
  rămasă. Donația se caută prin `referinteleIncasarii()` (sesiunea după
  `payment_intent`, factura după încasare). **Evenimentul trebuie bifat în
  Stripe**, la destinația webhook-ului; fără el nu rulează nimic.
- **Transferul în euro** se anunță cu moneda lui (`moneda` în formular, în
  rând, în e-mailuri și la confirmare).
- **Lunile și anii se taie la ora României**: conexiunea la bază pornește cu
  `-c timezone=Europe/Bucharest` (`lib/baza.ts`), iar marginile rapoartelor
  sunt scrise fără fus. Pusă ca interogare la `connect`, se călca cu prima
  interogare a clientului — de aceea e opțiune de conexiune.
- **Raportul anual** numără firmele încasate în anul lui.
- **Parola schimbată închide celelalte sesiuni și codul rapid**:
  `utilizatori.versiune_sesiune` intră în semnătura cookie-ului (versiunea 0
  semnează ca înainte, deci nimeni n-a fost dat afară la publicare). Crește
  la schimbarea parolei, la invitația folosită și la oprirea contului, care
  golește și `invitat_la`. Dispozitivul de pe care s-a schimbat parola
  primește aceeași sesiune semnată din nou (`sesiuneaResemnata`).
- **Firma și contractul merg împreună**: firma mutată la „semnat” sau „bani
  încasați” își mută contractul din registru, și invers, numai înainte.
- **„Firme fără răspuns”** ține seama de jurnal (`FIRME_UITATE_SQL` din
  `lib/crm.ts`), iar cifra duce la `/admin/firme?uitate=1`, făcută din
  aceeași condiție. „Cereri noi” duce la `?stadiu=nou`.
- **Căutarea** nu mai ține de diacritice (`translate` în interogări), de
  prefixul telefonului sau de „RO” la CUI.
- **Adresele de e-mail se țin cu litere mici** (`email()`, inserările de
  donații, un `UPDATE` de normalizare în `ADAOSURI`).
- **„Șterge-mi datele” oprește întâi donația lunară**; dacă Stripe nu
  răspunde, nu se șterge nimic.
- `/ziua-ta/<inexistent>` răspunde 404; „Fac alt folder” spune că înlocuiește.

**Rămase**: cele două e-mailuri despre Formularul 230 spun lucruri diferite
despre hârtia semnată (întrebare pentru asociație); `sesiuneProaspata`
socotește proaspete ultimele 12 ore ale unei sesiuni lungi.

**Reparate pe 11 noiembrie, seara**: exportul pentru Excel scrie datele la
ora României și telefonul ca `="0754…"` (Excel îi păstrează zeroul); un
voluntar înscris de două ori primește un singur apel (`faraDubluri`, după
e-mail sau ultimele nouă cifre ale telefonului); un număr de contract scris
de mână intră în registru, iar unul luat de altă firmă e refuzat
(`numarScrisDeMana`); o eroare Cloudinary (nu un 404) nu mai ține galeria
goală o oră — `cateEroriCloudinary()` crește, iar citirea cheamă
`cacheRezerva()`. Răspunsurile HTML ale șablonului și ale mesajelor din
panou au `Cache-Control: no-transform`: altfel Cloudflare înlocuia adresele
de e-mail din ele cu „[email protected]” și un script.

## Formularul de scris pe site: titlu, text, poze, „Publică”

Asociația, 11 noiembrie 2026: „e complicat mult… mai simplu”. Formularul
cerea rezumat, două feluri de dată, categorie, folder, numele folderului de
poze, anul lui și descrierea pozei, cu „Salvează ciorna” pus înaintea lui
„Publică”. Acum sus sunt numai **titlul, textul, (prima zi, la tabere), poza
principală și pozele pentru galerie**, iar butonul e **„Publică”**.

- Restul stă sub „Mai multe opțiuni (nu e nevoie de ele)” și se completează
  singur dacă e lăsat gol: descrierea pozei ia titlul, „cum se citește data”
  se scrie din prima zi, categoria din an.
- Folderul de poze nu se mai cere: se numește după titlu, în anul primei
  zile (`UrcaPozeTabara`). Fără titlu, spune „scrie întâi titlul”.
- „Salvează fără să publici” rămâne, mic, lângă buton; pe un text publicat
  se cheamă „Scoate de pe site”.
- După „Publică”, mesajul are linkul „Vezi pe site →”.
- **O probă completează ce completează omul**: câmpurile din „Mai multe
  opțiuni” sunt închise, deci `fill` pe ele cade — și bine face.

### Editorul: scrii ca într-un document (11 noiembrie 2026)

Asociația: „un editor sus, să pună un link, să evidențieze ceva, poze în
text, video de pe YouTube, Facebook”, „fără ciorni”. În meniu, sub Site:
**Blog** („Adaugă articol”), **Campanii**, **Tabere**, mereu la vedere.
Un text nou n-are „Salvează ciorna”: e „Publică”; pe unul publicat rămâne
„Scoate de pe site”.

- `componente/admin/EditorText.tsx` (TipTap): îngroșat, cursiv, subliniat,
  culoare (patru, din paleta site-ului), titlu, subtitlu, liste, citat,
  link, **poză în text** (`/api/admin/poza-in-text`, în Cloudinary
  `texte/`) și **video** YouTube sau Facebook (`adresaVideo`).
- Se salvează **HTML**, trecut prin `curataHtml` (`lib/curata-html.ts`,
  sanitize-html) **și la salvare, și la afișare**: script, `on…`,
  `javascript:`, stiluri lipite din Word, poze din afara Cloudinary, cadre
  spre alte site-uri — aruncate. YouTube merge pe `youtube-nocookie.com`
  (adăugat în CSP la `frame-src`).
- Textele vechi, cu semne (`##`, `- `, `**`), se afișează ca înainte și se
  transformă în HTML la prima deschidere în editor (`semneInHtml` din
  `lib/text-bogat.ts`); `textSimplu` scoate textul curat pentru rezumate.
- O probă scrie în `[data-editor]` cu tastatura; câmpul `continut` e ascuns.
  O probă care caută `<script>` în `main` găsește scripturile lui Next:
  caută în `.text-bogat`.
- **Textele paginilor fixe** (`/admin/texte`): cele zece blocuri lungi
  (`esteBogat` din `lib/texte-pagini.ts`: povestea, misiunea, viziunea,
  voluntarii, Casa Teona, „De ce” de la 3,5%) au editorul în varianta
  `simplu` — îngroșat, culoare, link, nimic de bloc. Frazele din capul
  paginilor rămân text simplu: stau în titluri și în descrierile pentru
  Google. Paginile le citesc prin `paragrafeBogate` / `intrUnParagraf`.
- **Cuvinte cheie** (`texte.etichete text[]`, în `ADAOSURI`;
  `lib/etichete.ts`): un câmp sub text, despărțite prin virgulă, fără
  dubluri, cel mult zece, `#` din față se scoate. Pe site apar sub text;
  la Blog și Campanii duc la `/noutati?eticheta=…` (lista filtrată), la
  tabere sunt doar de citit. Intră și în `<meta name="keywords">`; descrierea
  pentru Google ia primul paragraf când nu e scris un rezumat.
- **Pagina se umple după `load`**: conținutul unui articol vine din
  `Suspense`, deci o probă așteaptă `main h1`, nu doar codul 200. Click pe
  un cuvânt cheie e navigare fără reîncărcare: `waitForURL`.
- Probă pe tot drumul (scrie, formatează, poză în text, poză principală,
  galerie, cuvinte cheie, listă, schimbare, scoate de pe site, publică iar,
  șterge), pe toate trei: `scratchpad/tot.mjs`, local fără poze, pe site
  cu poze.
- **Fără asistent pe pagina de scris**: asociația, aceeași zi, „lasă cu
  ciorna, nu-i înțeleg sensul”. Componenta `Asistent` a rămas în cod.
- Probă în browser, pe toate trei: `scratchpad/editor2.mjs` (în afara
  depozitului) — formatare, culoare, link, video, link de video greșit,
  cod rău trimis pe lângă editor, ștergere.

## Decizii încă deschise

1. **Donațiile.** Acum merg prin GiveWP + Stripe pe WordPress, în lei, cu plată
   recurentă. Fie se rescrie peste Stripe aici, fie site-ul nou trimite la
   WordPress-ul existent pentru plăți. Nimic nu s-a decis.
2. **Cine editează conținutul. Rezolvat.** Din panou se scriu: noutățile și
   campaniile (`/admin/scrie`), descrierile taberelor, testimonialele
   (`/admin/testimoniale`), cele patru cifre (`/admin/cifre`), documentele de
   descărcat (`/admin/documente`), siglele sponsorilor (`/admin/sponsori`) și
   textele paginilor fixe (`/admin/texte`).
   De la 11 noiembrie 2026 și **echipa** de pe Despre noi (`/admin/echipa`,
   cu poză) și **aparițiile în presă** (`/admin/aparitii`), cu aceeași formă
   ca sponsorii: tabelul pornește cu lista din cod (`date/echipa.ts`,
   `date/aparitii-presa.ts`), nimic nu se șterge, se mută cu ↑↓
   (`lib/lista-panou.ts`). O apariție nouă intră prima; anul se citește din
   dată; un link de filmare Facebook primește playerul. Cazurile umanitare
   se scriu ca proiect, cu categoria „Cazuri umanitare”.
   Rămân prin dezvoltator: **structura** paginilor (titluri de secțiuni,
   fotografii, butoane, așezare) și paginile legale.
3. **CRM pentru donatori**, cu campanii de e-mail — urmează.

## Ce lipsește de la client

Caietul de sarcini cere materiale care încă n-au venit: data celei de-a 29-a
tabere RESPIRO (textul a venit fără nicio dată, deci tabăra n-are încă pagină),
descrierile taberelor din 9–13 iunie, 16–20 iunie și 15–19 septembrie 2025,
cazurile umanitare publicabile,
Formularul 230 și Declarația 177 precompletate,
testimonialele, siglele și adresele sponsorilor, fotografiile recente,
poza și descrierea Mihaelei Sfichi (lipsește de pe site-ul actual),
conturile „Culegătorii de Zâmbete", certificatul de înregistrare.

**Fotografii în rezoluție mare.** Cele moștenite de pe Facebook sunt prea
mici pentru locul în care stau: pe un ecran dens se văd înmuiate oricât de
puțin le-am comprima. Măsurat pe fir, șase fotografii de pe paginile
principale și cele trei portrete de echipă au originalul sub ce cere
ecranul:

| unde | fișier | are | ar trebui |
|---|---|---|---|
| `/despre-noi` | `278495378_…-1024x768.jpg` | 1024×768 | ≥1200 |
| `/casa-teona` | `379338367_…_n.jpg` | 720×960 | ≥1200 |
| `/casa-teona`, `/proiecte` | `347598753_…_n.jpg` | 768×1024 | ≥1200 |
| `/doneaza` | `449496204_…-768x1024.jpg` | 768×1024 | ≥1200 |
| `/doneaza` | `438814270_…-766x1024.jpg` | 766×1024 | ≥1000 |
| `/devino-voluntar` | `348477655_…_n.jpg` | 1024×768 | ≥1240 |
| echipă | `Screenshot_27…`, `Strimbu-Daniel-1`, `Screenshot_28…` | 176×265 | ≥400 |

Restul fotografiilor sunt deja servite la rezoluția ecranului. Dacă vin
originalele, se înlocuiesc fișierele cu același nume și nu se schimbă nimic
în cod.

## Comenzi

```bash
npm install
npm run dev      # dezvoltare
npm run build    # verifică TypeScript și compilarea
npm run start    # ascultă pe $PORT, cum cere Railway
```

Pe Railway pornește direct `node_modules/.bin/next start` (`railway.json`), nu
prin npm: la fiecare publicare containerul vechi primește SIGTERM, iar npm
scria atunci cinci rânduri roșii „npm error signal SIGTERM” în jurnal — o
oprire normală care arăta ca o cădere. `next start` citește singur `PORT`.

Înainte de orice commit: `npm run build` trebuie să treacă.
