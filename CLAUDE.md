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

## Date personale — ce NU intră aici

Exportul a fost curățat înainte de primul commit: s-au scos **13 donații** (cu nume,
e-mail și sumă), **293 de comentarii** și conturile de utilizator.

Donatorii merg într-o bază de date separată, nu în depozit. Pentru campanii de e-mail
e nevoie de acord explicit, bifat separat de donație — donatorii existenți **nu au**
un astfel de acord înregistrat, deci nu pot fi adăugați retroactiv pe o listă de
buletine informative.

## Decizii încă deschise

1. **Donațiile.** Acum merg prin GiveWP + Stripe pe WordPress, în lei, cu plată
   recurentă. Fie se rescrie peste Stripe aici, fie site-ul nou trimite la
   WordPress-ul existent pentru plăți. Nimic nu s-a decis.
2. **Cine editează conținutul.** Caietul de sarcini cere de peste șapte ori ca
   asociația să poată modifica singură textele, campaniile, testimonialele,
   proiectele și documentele. Fără un CMS, totul trece prin dezvoltator.
3. **CRM pentru donatori**, cu campanii de e-mail — urmează.

## Ce lipsește de la client

Caietul de sarcini cere materiale care încă n-au venit: clasificarea pozelor pe
proiecte și ani, lista proiectelor 2025 și 2026, cazurile umanitare publicabile,
Formularul 230 și Declarația 177 precompletate, contractul de sponsorizare,
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
