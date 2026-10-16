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
- **Cifra de control a CUI-ului** se verifică în browser înainte de orice
  cerere: cheia e aliniată la dreapta, cu zerouri în față (`src/lib/cui.ts`).
- Căutarea nu blochează nimic: dacă ANAF nu răspunde, câmpurile se completează
  de mână. O firmă înființată luna trecută n-are bilanț și trebuie totuși să
  poată trimite formularul.
- Probă: `BAZA=http://localhost:3000 node scripts/qa/firma-anaf.mjs` (cere
  internet — datele vin de la ANAF, în direct).

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
- **`/admin/poze`** — ce e în Cloudinary și la ce proiect au ajuns pozele.
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

## Decizii încă deschise

1. **Donațiile.** Acum merg prin GiveWP + Stripe pe WordPress, în lei, cu plată
   recurentă. Fie se rescrie peste Stripe aici, fie site-ul nou trimite la
   WordPress-ul existent pentru plăți. Nimic nu s-a decis.
2. **Cine editează conținutul.** Rezolvat pe jumătate: noutățile și campaniile
   se scriu din panou, cu poze (`/admin/scrie`). Rămân prin dezvoltator
   testimonialele, descrierile proiectelor, documentele și textele paginilor
   fixe.
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
