# Auditul panoului /admin — teona-ariana.ro

Început pe 18 noiembrie 2026, odată cu refacerea panoului (logică, găsit rapid,
design), pe etapele din cerere. Fișierul se completează după fiecare etapă.

## Etapa 0 — inventarul și verificarea inițială (înainte de schimbări)

### Cum s-a verificat
- **Codul**: fiecare `page.tsx` din `src/app/admin` (38) și fiecare `route.ts`
  din `src/app/api/admin` (48 + manifestul și lucrătorul PWA), citite unul câte
  unul: ce face, ce citește, ce scrie, ce formulare are și unde trimit, ce drept
  cere.
- **Site-ul adevărat**: un browser automat, intrat cu cheia de probă, a deschis
  toate paginile panoului la 1440 px și la 390 px: codul HTTP, timpul până
  dispare „Se încarcă…”, erorile din consolă, cererile 4xx/5xx, derularea
  laterală și etichetele scurte (meniu, butoane, stadii) rupte pe două rânduri.
  Scriptul: `scratchpad/audit0/crawl.mjs`. Numai citire.

### Ce face fiecare pagină

| Pagina | Ce face | Citește | Formulare → rută | Drept |
|---|---|---|---|---|
| /admin | Tabloul de bord, „De făcut acum” | donatii, firme, cereri, campanii_aniversare, mesaje_firme, plati_esuate, texte | notificări → /api/admin/push | /admin |
| /admin/rapoarte | Rapoarte PDF, exporturi CSV | texte, donatii | 3 GET → /api/admin/raport; 4 → /api/admin/export | /admin/rapoarte |
| /admin/analiza | Profil donatori/firme, GA4, Meta, consultant AI | analize, donatii, firme, texte; GA4; Meta | → /api/admin/analiza, /api/admin/sfatuitor | /admin/analiza |
| /admin/radar | Piste de finanțare | radar, radar_scanari | scanează/urmăresc/respinge → /api/admin/radar | /admin/radar |
| /admin/donatii | Donații, transferuri, plăți eșuate, donație de mână | donatii, plati_esuate | → /api/admin/donatii/confirma, /api/admin/donatii; export | /admin/donatii |
| /admin/donatori | Donatori, jurnal, „Uită-l” | donatii, note_donatori, interactiuni | → /api/admin/jurnal, /api/admin/donatori; export | /admin/donatori |
| /admin/firme | Panoul pe coloane | firme, mesaje_firme | căutare în pagină; export | /admin/firme |
| /admin/firme/[id]/mesaje | Pagina firmei: discuție, stadiu, jurnal | firme, mesaje_firme, interactiuni, texte | → /api/admin/firme, …/refuz, …/mesaje, …/previzualizare, …/sterge, /api/admin/jurnal | /admin/firme |
| /admin/firme/[id]/contract | Contractul de sponsorizare | firme, ANAF | → /api/admin/contract | /admin/firme |
| /admin/firme/scrie | E-mail nou către firme | firme, texte | → /api/admin/firme/mesaje, …/previzualizare | /admin/firme |
| /admin/contracte | Registrul contractelor | contracte, firme | → /api/admin/contracte | /admin/contracte |
| /admin/cereri | Cereri (contact, voluntariat, 3,5%) | cereri | stadiu → /api/admin/cereri; export | /admin/cereri |
| /admin/voluntari | Baza de voluntari, apel | cereri, apeluri_voluntari, raspunsuri_voluntari | filtre GET; apel → /api/admin/voluntari/apel | /admin/voluntari |
| /admin/formulare | Formularele 230 | cereri; R2 | PDF gol → /api/admin/formulare; adaugă/stadiu → /api/admin/cereri | /admin/formulare |
| /admin/aniversari | Paginile de ziua cuiva de aprobat | campanii_aniversare, donatii | → /api/admin/campanii | /admin/aniversari |
| /admin/scrie, /admin/scrie/[id] | Blog, campanii, tabere; editorul | texte; Cloudinary | → /api/admin/texte, poza-in-text, poze-tabara | /admin/scrie |
| /admin/pagini | Cardurile paginilor site-ului | texte_pagini | linkuri | /admin/pagini |
| /admin/texte, cifre, documente, sponsori, testimoniale, echipa, aparitii | Conținutul paginilor fixe | tabelele lor; R2; Cloudinary | → rutele cu același nume | fiecare pe calea ei |
| /admin/poze | Pozele din Cloudinary și legătura cu proiectele | Cloudinary | — | /admin/poze |
| /admin/sabloane | Șabloanele de campanie | MailerLite (grupuri) | → /api/admin/sablon | /admin/sabloane |
| /admin/emailuri | Catalogul e-mailurilor site-ului | în cod | → /api/admin/email | /admin/emailuri |
| /admin/facebook | Cifrele paginii, postarea unui text | texte; Graph API | → /api/admin/facebook | /admin/facebook |
| /admin/abonati, /abonati/incarca | Abonații; încărcarea de adrese | abonati_buletin; MailerLite | → /api/admin/abonati | fiecare pe calea ei |
| /admin/presa | Contacte de presă, comunicat | contacte_presa | → /api/admin/presa, …/trimite | /admin/presa |
| /admin/calendar | Calendarul publicărilor | texte; momente din cod | → /api/admin/calendar | /admin/calendar |
| /admin/qr | Coduri QR | — | → /api/admin/qr | /admin/qr |
| /admin/utilizatori | Conturi și roluri | utilizatori | → /api/admin/utilizatori | numai administrator |
| /admin/parola | Parola proprie, codul rapid | utilizatori | → /api/admin/parola, /api/admin/cod-rapid | /admin/parola |
| /admin/setari | Pașii de pornit pentru e-mailurile cu firmele | mediu | — | /admin/setari |
| /admin/cauta | Căutare (donatori, firme, cereri) | donatii, firme, cereri | GET | /admin/cauta |

**Rutele API** (48): fiecare rută care scrie cere `arePermisiune` pe pagina ei,
afară de: `intrare`/`iesire` (intenționat), `curata-proba` (numai cheia de
probă, intenționat), `push` (orice sesiune), `jurnal` (dreptul se ia din
`inapoi`). Panoul nu scrie nimic în Stripe.

### Ce s-a găsit pe site (înainte de schimbări)

| Pagina | Cod | Desktop | Telefon | Iese în lateral | Erori |
|---|---|---|---|---|---|
| `/admin` | 200 | 1186 ms | 732 ms | nu | — |
| `/admin/rapoarte` | 200 | 255 ms | 527 ms | nu | — |
| `/admin/analiza` | 200 | 1373 ms | 1144 ms | nu | — |
| `/admin/radar` | 200 | 573 ms | 578 ms | nu | — |
| `/admin/donatii` | 200 | 557 ms | 594 ms | nu | — |
| `/admin/donatori` | 200 | 608 ms | 590 ms | nu | cdn-cgi (Cloudflare) |
| `/admin/firme` | 200 | 548 ms | 578 ms | nu | — |
| `/admin/firme/scrie` | 200 | 585 ms | 548 ms | nu | — |
| `/admin/setari` | 200 | 296 ms | 258 ms | nu | — |
| `/admin/contracte` | 200 | 561 ms | 560 ms | nu | — |
| `/admin/cereri` | 200 | 323 ms | 528 ms | nu | cdn-cgi (Cloudflare) |
| `/admin/voluntari` | 200 | 565 ms | 543 ms | nu | — |
| `/admin/aniversari` | 200 | 316 ms | 322 ms | nu | — |
| `/admin/sabloane` | 200 | 678 ms | 687 ms | nu | — |
| `/admin/emailuri` | 200 | 524 ms | 598 ms | nu | — |
| `/admin/qr` | 200 | 263 ms | 326 ms | nu | — |
| `/admin/presa` | 200 | 283 ms | 564 ms | nu | cdn-cgi (Cloudflare) |
| `/admin/abonati` | 200 | 516 ms | 584 ms | nu | — |
| `/admin/abonati/incarca` | 200 | 293 ms | 543 ms | nu | — |
| `/admin/calendar` | 200 | 545 ms | 613 ms | nu | — |
| `/admin/cauta?q=ana` | 200 | 618 ms | 556 ms | nu | cdn-cgi (Cloudflare) |
| `/admin/parola` | 200 | 285 ms | 279 ms | nu | — |
| `/admin/formulare` | 200 | 297 ms | 544 ms | nu | — |
| `/admin/scrie?fel=noutate` | 200 | 284 ms | 319 ms | nu | — |
| `/admin/scrie?fel=campanie` | 200 | 242 ms | 575 ms | nu | — |
| `/admin/scrie?fel=proiect` | 200 | 515 ms | 580 ms | nu | — |
| `/admin/scrie/nou?fel=noutate` | 200 | 223 ms | 558 ms | nu | — |
| `/admin/poze` | 200 | 1065 ms | 1136 ms | nu | — |
| `/admin/testimoniale` | 200 | 584 ms | 545 ms | nu | — |
| `/admin/cifre` | 200 | 289 ms | 281 ms | nu | — |
| `/admin/documente` | 200 | 910 ms | 930 ms | nu | — |
| `/admin/sponsori` | 200 | 632 ms | 543 ms | nu | — |
| `/admin/echipa` | 200 | 554 ms | 580 ms | nu | — |
| `/admin/aparitii` | 200 | 1062 ms | 532 ms | nu | — |
| `/admin/texte` | 200 | 580 ms | 534 ms | nu | — |
| `/admin/pagini` | 200 | 558 ms | 539 ms | nu | — |
| `/admin/facebook` | 200 | 568 ms | 297 ms | nu | — |
| `/admin/utilizatori` | 200 | 272 ms | 524 ms | nu | — |

**Viteza**: toate paginile sub 1,4 s; cele mai lente sunt Analiza (1,1–1,4 s,
cere Google Analytics și Meta) și Poze/Aparitii/Documente (≈1 s, Cloudinary/R2).
Formularul 230 s-a deschis în 0,3–0,5 s cu cheia de probă; încetineala văzută
de asociație nu s-a reprodus aici (de reverificat cu un cont adevărat, fiindcă
paginile cu date sensibile cer confirmare după 12 ore).

### Probleme găsite

| # | Unde | Ce e greșit | Fel | Stare |
|---|---|---|---|---|
| 1 | Cereri, Presă, Donatori, Căutare | Cloudflare („Email Obfuscation”) înlocuia adresele de e-mail cu „[email protected]”, iar scriptul lui cădea cu eroare în consolă | merge? | **reparat** (etapa 0): `no-transform` pe tot `/admin`, din `src/proxy.ts` |
| 2 | Formular 230 | schimbarea stadiului te duce pe pagina Cereri (`formulare/page.tsx:384`, `cereri/route.ts:87`) | logic | etapa 4 |
| 3 | `/api/admin/push` | „proba” trimite notificarea pe telefoanele tuturor; dezabonarea nu verifică al cui e abonamentul | sigur | etapa 7 |
| 4 | Meniu / PAGINI | `/admin/firme/mesaje` (acum redirecționare) și `/admin/firme/scrie` sunt drepturi pe care nu le cere nicio pagină | logic | etapa 1 (meniul) |
| 5 | Cod mort | `firme/lead` (formularul a fost scos), `Asistent`, `PrevizualizareEmail`, `CompunereEmail` nu mai sunt folosite | întreținere | de scos la final, dacă nu se refolosesc |
| 6 | Liste | conținut afișat întreg: cererile (toate câmpurile), aniversările (mesajul), radarul (rezumatul), jurnalul, observațiile la donații/contracte/presă; abonații — 500 de rânduri deodată | intuitiv/viteză | etapele 3–6 |
| 7 | Texte lungi | paragrafe explicative de 250–430 de semne pe Contract, Analiză, Setări, Contracte, Radar, Donatori, Donații, E-mail nou, Consultant, Voluntari | intuitiv | etapele 3–6, la „ⓘ Cum funcționează” |
| 8 | Liste N+1 | trimiterea la 30 de firme, încărcarea a 200 de abonați (o cerere la MailerLite pe adresă), apelul la voluntari — secvențiale | viteză | de măsurat; acceptabile la limitele de azi |
| 9 | Pagini care scriu la deschidere | pagina firmei marchează citite răspunsurile; lista firmelor pe cele nelegate | logic | intenționat (citit = deschis); proba nu le marchează |
| 10 | Etichete rupte pe două rânduri | nimic găsit la 1440 și 390 px | design | — |


## Etapa 1 — găsit rapid și meniul (18 noiembrie 2026)

| Ce | Înainte | Acum |
|---|---|---|
| Căutarea | câmp în meniu, nimic până la Enter; numai donatori, firme, cereri | **Ctrl K / Cmd K / „/”** sau clic pe câmp: fereastră cu rezultate cât scrii (150 ms), grupate Pagini · Acțiuni · Firme · Donatori · Cereri · Voluntari · Contracte · Articole și campanii · Presă; fără diacritice; după nume, e-mail, telefon, CUI; săgeți/Enter/Esc; ultimele 5 deschise; Enter pe nimic → `/admin/cauta` (care arată acum toate grupurile). Serverul: `/api/admin/cauta`, cel mult 5 pe grup, numai din paginile pe care rolul le vede; median măsurat local < 300 ms |
| Acțiuni directe | — | Donație nouă (deschide formularul de pe Donații), E-mail nou către o firmă, Articol nou, Campanie nouă, Comunicat de presă, Raport lunar |
| Meniul | 7 grupe pliabile („Cum stăm”, „Banii”, „Oameni care așteaptă”, „E-mail și promovare”…), Formular 230 la Oameni, Radar la Cum stăm, Șabloane și Mesaje separate, Încarcă abonați ca intrare | Acasă · Bani (Donații, Donatori, Formular 230) · Sponsori și finanțări (Firme, Contracte, Radar finanțări) · Oameni (Cereri, Voluntari, Aniversări) · Site · Promovare (Calendar, E-mailuri, Abonați, Facebook, Presă, Coduri QR) · Rapoarte (Rapoarte, Analiză); jos Setări și contul. Toate deschise, iconițe Lucide 18 px, 36 px, colțuri 10 px, culoarea secțiunii la elementul activ (fundal 16% + bară de 3 px), bara de derulare subțire, restrângere la iconițe ținută minte |
| E-mailuri | două intrări | o intrare, cu filele Mesajele trimise · Șabloane |
| Setări | numai pașii pentru e-mailuri | Contul meu, Utilizatori, Panoul ca aplicație, pașii pentru e-mailuri |
| Telefon | meniul ca bandă derulată orizontal | sertar din stânga peste pagină + bara de jos Acasă · De făcut · Firme · Cereri · Caută |
| Meniul se redesena la fiecare pagină | fiecare pagină își desena meniul (de două ori cât timp se încărca) | meniul stă în `admin/layout.tsx`; elementul activ se citește din adresă; bulinele se cer din nou la fiecare schimbare de pagină (`/api/admin/semne`), din aceeași funcție ca „De făcut acum” |
| Bulina „Cereri” | lipsea (linkul cardului avea „?” și nu-și mai găsea intrarea) | `deFacutAcum` are `meniu` separat de `unde` |
| Preîncărcare | niciuna | la trecerea mouse-ului peste un link din meniu |

Găsite și reparate pe drum: fereastra de căutare era prinsă în bara laterală
(un părinte cu `transform` face ca `fixed` să fie relativ la el) — pe telefon
nu se vedea; stă acum în `body`. Esc o închide de oriunde.

Probă: `scratchpad/mf/cautare.mjs` (38), plus toate cele de dinainte (trec).
