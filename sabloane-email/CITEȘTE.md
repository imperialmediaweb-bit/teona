# Șabloanele de campanie pentru MailerLite

Două fișiere, pentru cele două liste:

| fișier | pentru cine | butonul principal duce la |
|---|---|---|
| `persoane-fizice.html` | donatori, oameni de pe listă | pagina Donează |
| `firme.html` | companii | pagina Direcționează 20% |

## Cum le urci

1. În MailerLite: **Campaigns → Create campaign**, iar la pasul de conținut
   alege varianta cu **HTML propriu** („Custom HTML" / „Paste your own HTML",
   după cum e numită în contul tău).
2. Deschizi fișierul cu Notepad sau cu orice editor de text, selectezi tot
   (Ctrl+A), copiezi (Ctrl+C) și lipești în MailerLite.
3. **Trimite-ți întâi ție o probă.** Pe Gmail și, dacă poți, pe Outlook — ele
   randează cel mai diferit.

Odată urcat, poți salva campania ca șablon în contul tău, ca data viitoare să
nu mai lipești nimic.

## Ce schimbi la fiecare campanie

Caută în fișier cuvântul **SCHIMBĂ**. Sunt șase locuri, în ordinea în care
apar:

1. **textul de previzualizare** — prima linie din inbox, lângă subiect;
2. **titlul**;
3. **cele două-trei paragrafe**;
4. **fotografia de sus** și descrierea ei;
5. **textul butonului**, dacă e nevoie;
6. **linkul de dezabonare**.

## Trei lucruri de care să nu te atingi

**Dezabonarea.** E obligatorie prin lege în UE. În fișier e lăsat un link gol,
marcat `SCHIMBĂ 6`: pune acolo linkul de dezabonare din contul tău MailerLite
(ți-l dă editorul lor, în blocul de subsol). Fără el, e-mailul e ilegal și
ajunge direct la spam.

**Datele asociației din subsol.** Denumirea, CIF-ul și adresa trebuie să fie
acolo — tot pentru lege, și tot pentru filtrele de spam.

**Fotografia trebuie să fie orizontală.** Una verticală, la 600 px lățime,
iese de 800 px înălțime: omul derulează un ecran întreg înainte de primul
cuvânt și renunță.

## De ce codul arată atât de ciudat

Tabele în loc de `div`-uri, stiluri scrise pe fiecare element, butoane făcute
din celule colorate. Nu e neglijență: Outlook pe Windows randează e-mailurile
cu motorul lui Word, care nu știe aranjări moderne și ignoră foile de stil. Un
e-mail scris ca o pagină de site se destramă acolo, iar Outlook e des întâlnit
exact la firme.

Lățimea e 600 px pentru că atât intră în panoul de previzualizare din Outlook
fără derulare laterală.

## Un avertisment despre cifre

Nu scrie în e-mail un termen de depunere, un procent sau o sumă pe care nu
le-ai verificat pentru anul fiscal în curs. Regulile se schimbă de la an la an,
iar o firmă care depune greșit pe baza unui e-mail de la asociație nu mai
sponsorizează niciodată. Trimite omul la pagină și la contabilitatea lui.

## Personalizarea (opțional)

Dacă vrei „Bună, Maria!" în loc de „Bună ziua,", eticheta de câmp o ia din
editorul MailerLite: butonul de personalizare îți dă forma exactă, pentru că
diferă de la un cont la altul. În fișiere e marcat locul cu un comentariu
`PERSONALIZARE`. Lăsate așa cum sunt, e-mailurile sunt corecte pentru toată
lumea — nimeni nu primește „Bună, ,".

## Fotografiile

Se încarcă de pe site, de la `www.teona-ariana.ro`. **Până la lansare, adresele
alea nu răspund.** Dacă trimiți o campanie înainte de lansare, urcă pozele în
MailerLite și înlocuiește adresele din `src`.
