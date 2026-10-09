# Modulul „Donează-ți ziua de naștere”

Ce face: cineva își creează pe site-ul asociației o pagină de campanie, cu
poza și mesajul lui, o verifică asociația, apoi o distribuie prietenilor.
Poza apare ca previzualizare pe Facebook și WhatsApp — lucrul pe care
formularul de pe Galantom nu-l are.

Banii nu trec prin site. Butonul „Donează” de pe pagina de campanie duce la
Galantom: la pagina personală a omului dacă ne-a dat linkul (atunci
donațiile se adună pe numele lui și vede totalul), altfel la proiectul
asociației.

## Ce trebuie făcut înainte de lansare

### 1. Parola pentru verificare — fără ea, zona nu funcționează

În Railway → serviciul `site` → Variables, adaugă `PAROLA_ADMIN`, cu **cel
puțin 12 caractere**. Fără ea, `/admin/campanii` spune că nu e configurată și
nimeni nu poate publica nicio campanie.

Parola n-a fost pusă de dezvoltator intenționat: o alege asociația, ca să nu
treacă prin nicio conversație și prin niciun fișier.

### 2. Cine verifică campaniile, și cât de des

Campaniile nu apar singure. Cineva din asociație trebuie să intre pe
`/admin/campanii`, să citească textul, să se uite la poză și să apese
„Publică” sau „Respinge”.

**Deocamdată nu pleacă niciun e-mail de anunț** — site-ul nu are încă
serviciu de trimitere a e-mailurilor (același motiv pentru care formularul de
contact răspunde cinstit că nu trimite). Până se alege unul:

- cineva trebuie să verifice pagina de câteva ori pe zi;
- omul care și-a creat campania **nu primește** linkul pe e-mail. Îl vede pe
  ecran imediat după trimitere, cu un jeton personal, și i se spune să-l
  păstreze.

Asta e singura parte a modulului care nu e completă, și nu din scăpare: fără
un serviciu de e-mail nu se poate.

### 3. Paragraful din politica de confidențialitate

Modulul colectează date personale noi, iar politica actuală nu le acoperă.
**Textul de mai jos e o propunere, nu text aprobat** — trebuie citit și
acceptat de asociație înainte de lansare, și abia apoi pus în
`continut/pagini.json`.

> **Campanii aniversare.** Dacă îți creezi o pagină de campanie („Donează-ți
> ziua de naștere”), colectăm numele pe care îl alegi, titlul, mesajul,
> fotografia pe care o încarci, data evenimentului dacă o completezi, adresa
> de e-mail și, opțional, linkul paginii tale de pe Galantom. Numele,
> titlul, mesajul, fotografia și data apar public pe pagina campaniei, după
> ce o verificăm. Adresa de e-mail nu apare nicăieri și o folosim doar ca să
> te anunțăm despre campania ta. Temeiul prelucrării este consimțământul tău,
> dat la trimiterea formularului. Fotografiile sunt stocate la Cloudinary,
> iar restul datelor în baza de date a site-ului. Păstrăm campaniile cât timp
> sunt publice și încă 12 luni după aceea, pentru evidența donațiilor.
> Poți cere oricând ștergerea paginii și a datelor, scriind la
> contact@teona-ariana.ro.

Dacă asociația vrea alt termen de păstrare decât 12 luni, se schimbă aici și
în cod nu e nevoie de nimic.

### 4. Regiunea bazei de date

Baza de date Postgres a proiectului e în **us-west2** (Oregon, Statele
Unite). Până acum nu conta: site-ul nu stoca date personale. De acum
stochează nume, e-mailuri și fotografii.

Decizia e a asociației: se mută baza în regiunea europeană a Railway
(`europe-west4`) sau se rămâne unde e. **Mutarea e mult mai ușoară acum, cât
timp tabela e goală**, decât după ce se adună campanii.

## Ce se întâmplă cu o poză respinsă

Rămâne în Cloudinary. Nu se vede nicăieri, pentru că pagina campaniei nu se
mai randează, dar fișierul e acolo. Dacă asociația vrea ștergere automată la
respingere, se adaugă — nu e făcut acum pentru că o poză ștearsă din greșeală
nu se mai poate recupera, iar o respingere poate fi răzgândită.

## O limită care nu e intenționată

O campanie care nu există răspunde cu **codul 200** și cu pagina de „Campanie
negăsită" în corp, în loc să răspundă cu codul 404.

Cauza: Next.js cu `cacheComponents` cere fiecărei rute un înveliș care se
poate pregăti dinainte, iar aici tot conținutul se citește din baza de date la
cerere. Învelișul pleacă spre browser înainte să se știe dacă rândul există,
iar după ce a plecat codul HTTP nu se mai poate schimba. Am încercat varianta
fără înveliș, cu `connection()` ca primă instrucțiune și în metadate:
construirea se oprește.

Ce **nu** e afectat, verificat pe site-ul live:

- conținutul nepublicat nu se scurge — fără jeton, sau cu un jeton greșit, se
  vede pagina de „Campanie negăsită", nu campania;
- paginile sunt `noindex` și interzise în `robots.txt`, deci niciun motor de
  căutare nu ajunge acolo;
- previzualizarea pe Facebook și WhatsApp funcționează normal.

Aceeași problemă există deja la `/proiecte/<adresă inexistentă>`, din același
motiv. Se rezolvă împreună, dacă merită.

## Limite puse intenționat

- O poză: cel mult 6 MB, doar JPG, PNG sau WebP. Se verifică primii octeți ai
  fișierului, nu doar ce spune browserul.
- Cel mult 3 campanii trimise de la aceeași adresă IP într-o jumătate de oră.
- Cel mult 5 încercări de parolă la zona de verificare într-un sfert de oră.
- Linkul de donație e acceptat numai dacă e o adresă de pe `galantom.ro`.
- Paginile de campanie sunt `noindex` și excluse din `robots.txt`: sunt
  despre oameni și trec repede. Distribuirea pe Facebook nu e afectată —
  rețelele citesc `og:`, nu `robots.txt`.
