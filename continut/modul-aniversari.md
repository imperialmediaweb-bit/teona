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

---

# Plăți: Stripe, PayPal, Revolut

## Ce e scris și ce lipsește

Codul e complet pentru toate trei. Niciuna nu funcționează fără chei, și
fiecare se aprinde singură când își găsește cheile în mediu — fără chei,
metoda nu apare pe site. Nu există buton care să dea eroare.

### Stripe — plata cu cardul, în lei

Prin **Stripe Checkout**, pagina găzduită de ei. Niciun număr de card nu
trece prin serverul asociației, deci site-ul nu intră în sfera PCI-DSS.
Apple Pay și Google Pay apar singure pe telefoanele care le au. Donația
lunară e un abonament Stripe adevărat, nu o plată pe care o programăm noi.

Variabile: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Webhookul e obligatoriu**, nu opțional. O donație se consideră încasată
numai când sosește de la Stripe un mesaj semnat. Pagina de mulțumire nu
dovedește nimic — adresa ei o poate deschide oricine. În panoul Stripe,
adresa de notificare e:

```
https://teona-ariana.ro/api/donatii/stripe/webhook
```

cu evenimentele `checkout.session.completed` și `invoice.paid`. Al doilea e
pentru reînnoirile lunare: fiecare lună e o donație nouă în evidență, altfel
un om care dă în fiecare lună ar apărea cu o singură donație.

### PayPal — în euro

Pentru donatorii din străinătate. **Nu convertim nimic**: PayPal nu suportă
leul, iar un buton care scrie „100 lei" și debitează 19,65 € ar strica
exact încrederea de care depinde o asociație.

Variabile: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`,
iar `PAYPAL_MOD=live` când se trece de la testare la real (implicit e
sandbox, deci nu se încasează nimic din greșeală).

### Revolut — un link, nu o integrare

Blocul apare numai dacă se pune `REVOLUT_LINK`. E scris pe pagină ca ce
este: plata se face în aplicația Revolut, nu pe site.

**Ce nu se poate, oricât am vrea:** banii nu trec prin site, deci site-ul nu
află niciodată că s-a plătit, cât, sau de către cine. Butonul trece printr-o
rută a noastră care numără **apăsările** — adică intenția, nu donația. Nu
există raport de donații Revolut și nu poate exista.

**Două lucruri de verificat înainte de a pune linkul:**

- un link `revolut.me` primește cel mult ~250 £ pe săptămână prin card și
  cel mult 20 de plăți pe săptămână. O campanie care merge bine lovește
  plafonul și donațiile pică;
- dacă linkul e al unei **persoane**, nu al asociației, banii intră într-un
  cont personal. Pentru o asociație cu CIF, asta strică și contabilitatea, și
  încrederea. Revolut Business exclude explicit organizațiile caritabile, deci
  un cont de firmă pe asociație probabil nici nu se poate deschide.

## Lista de buletin — regula care nu se negociază

Pe formularul de donație există deja o bifă separată, **nebifată din start**:
„Vreau să primesc ocazional vești despre activitatea asociației."

Numai cine o bifează ajunge în MailerLite. O donație nu e acord de marketing.
Din același motiv nu există nicăieri o funcție care să urce donatorii
existenți — ei n-au dat un asemenea acord, deci nu pot fi adăugați
retroactiv.

Variabile: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`. Până vin, acordul se
păstrează în baza de date și oamenii se urcă mai târziu. Nimic nu se pierde.

## Ce trebuie făcut, în ordine

1. Cont **Stripe** pe asociație (CIF 43533953). Verificarea durează — începeți-o
   înainte de restul.
2. După verificare: cheile în Railway, apoi webhookul în panoul Stripe.
3. Cont **PayPal Business** pe asociație, apoi cheile și webhookul.
4. Cont **MailerLite**, cheia și identificatorul grupului.
5. Revolut, **dacă** se decide că merită, cu cele două verificări de mai sus.

Până atunci formularul spune cinstit că plata cu cardul se activează în
curând și arată căile care funcționează acum: Galantom, SMS, transfer bancar.
