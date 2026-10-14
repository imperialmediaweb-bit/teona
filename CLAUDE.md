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
  Căutarea pe identificator rămâne ca rezervă, pentru conturile în modul vechi;
- în panou, la `/admin/poze`, se vede sub fiecare folder la ce proiect au
  ajuns pozele lui, sau că n-a ajuns la niciunul;
- taberele mari au pozele pe subfoldere („ZIUA 1”, „GRUP”); se citesc două
  niveluri în adâncime;
- proba `node scripts/qa/poze-cloud.mjs` verifică potrivirea fără cheile
  adevărate, cu un server care imită Cloudinary.

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

## Decizii încă deschise

1. **Donațiile.** Acum merg prin GiveWP + Stripe pe WordPress, în lei, cu plată
   recurentă. Fie se rescrie peste Stripe aici, fie site-ul nou trimite la
   WordPress-ul existent pentru plăți. Nimic nu s-a decis.
2. **Cine editează conținutul.** Caietul de sarcini cere de peste șapte ori ca
   asociația să poată modifica singură textele, campaniile, testimonialele,
   proiectele și documentele. Fără un CMS, totul trece prin dezvoltator.
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

## Comenzi

```bash
npm install
npm run dev      # dezvoltare
npm run build    # verifică TypeScript și compilarea
npm run start    # ascultă pe $PORT, cum cere Railway
```

Înainte de orice commit: `npm run build` trebuie să treacă.
