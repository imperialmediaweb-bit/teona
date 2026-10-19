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
lui dispărea pentru o oră. Acum fereastra e de cinci minute. **Probele care
citesc o pagină publică după o salvare trebuie să aștepte**, sau să golească
întâi eticheta cu o salvare care nu schimbă nimic.

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

Comunicatul **nu pleacă din panou**: adresele se copiază și se pun la Bcc în
Gmail-ul asociației. Un mesaj trimis de serverul nostru către opt redacții
deodată ajunge în spam exact la cei pe care vrei să-i prinzi. Pagina ține și
forma unui comunicat pe care o redacție îl publică (titlu, primul paragraf
care spune tot, citat cu nume, contact) și amintește de acordul părinților
pentru pozele cu copii.

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
- **Parola nu trece niciodată prin adresă** și nu se arată nicăieri — nici cea
  pusă de administrator la facerea contului. El o scrie, deci o știe; i-o spune
  omului cum vrea, iar omul o schimbă din `/admin/parola`, unde se cere și
  parola de acum (un laptop lăsat deschis nu e de ajuns ca să iei contul
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
nu se încheie niciodată, deci nu i se poate pune un orar. Se face un al doilea
serviciu, mic, care cheamă o dată adresa și iese:

```
curl -fsS -X POST https://<site>/api/radar -H "x-radar: $RADAR_SECRET"
```

Orarul se pune pe serviciul ăla: `0 6 * * 1` = luni la 6:00 **UTC** (cron-ul de
pe Railway e în UTC, nu ora României). Granularitatea minimă e 5 minute, iar
dacă o rulare mai e în curs când vine următoarea, Railway o sare — nu le
stivuiește. Pașii sunt scriși și pe pagină, ca la Facebook: omul care se
întreabă „de ce n-a mai scanat nimic?" e în panou, nu în depozitul de cod.

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

## Decizii încă deschise

1. **Donațiile.** Acum merg prin GiveWP + Stripe pe WordPress, în lei, cu plată
   recurentă. Fie se rescrie peste Stripe aici, fie site-ul nou trimite la
   WordPress-ul existent pentru plăți. Nimic nu s-a decis.
2. **Cine editează conținutul. Rezolvat.** Din panou se scriu: noutățile și
   campaniile (`/admin/scrie`), descrierile taberelor, testimonialele
   (`/admin/testimoniale`), cele patru cifre (`/admin/cifre`), documentele de
   descărcat (`/admin/documente`), siglele sponsorilor (`/admin/sponsori`) și
   textele paginilor fixe (`/admin/texte`).
   Rămân prin dezvoltator: **structura** paginilor (titluri de secțiuni,
   fotografii, butoane, așezare), fișa echipei, descrierile cazurilor
   umanitare și paginile legale.
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

Înainte de orice commit: `npm run build` trebuie să treacă.
