# Lista de verificat la lansare

De parcurs în ordine, în ziua în care `teona-ariana.ro` trece pe site-ul nou.

## 1. Indexarea — cel mai ușor de uitat, cel mai scump

Cât timp site-ul stă pe adresa de previzualizare Railway, variabila
`ADRESA_SITE` este setată pe `https://site-production-641f.up.railway.app`.
Atât timp cât e setată pe adresa de previzualizare, **tot site-ul e `noindex`**:
`robots.txt` răspunde `Disallow: /`, iar fiecare pagină are
`<meta name="robots" content="noindex, nofollow">`. Asta e intenționat — altfel
Google ar indexa previzualizarea ca pe o copie a site-ului vechi, care
deocamdată încă rulează pe domeniul real.

La lansare:

- [ ] În Railway → serviciul site → Variables: pune `ADRESA_SITE` pe
      `https://www.teona-ariana.ro` (sau șterge variabila; valoarea implicită din
      `src/app/seo.tsx` e tot domeniul real).
- [ ] Așteaptă redeploy-ul și verifică:
      `curl https://www.teona-ariana.ro/robots.txt` → trebuie `Allow: /`
      `curl -s https://www.teona-ariana.ro/ | grep 'name="robots"'` → **nimic**
- [ ] `curl -s https://www.teona-ariana.ro/ | grep canonical` → `https://www.teona-ariana.ro`
- [ ] Trimite `https://www.teona-ariana.ro/sitemap.xml` în Google Search Console.

**Dacă se uită pasul ăsta, site-ul nou e invizibil în Google.**

## 2. Linkurile vechi

- [ ] Verifică la întâmplare 5 adrese vechi indexate de Google
      (`site:teona-ariana.ro` în Google) — toate trebuie să dea 301 către
      pagina nouă, nu 404. Redirecționările sunt în `src/date/redirectionari.ts`
      și în `next.config.ts`.

## 3. Depozitul de cod

- [ ] `github.com/imperialmediaweb-bit/teona` → Settings → Danger Zone →
      **Change visibility → Make private**. Depozitul conține exportul
      WordPress (`scripts/export-wordpress.xml`) și fotografii cu copii.
- [ ] Decide cu asociația dacă exportul rămâne în depozit sau se mută într-un
      loc privat (vezi `AUDIT-SECURITATE.md`).

## 4. Secrete

- [ ] Cheile Cloudinary se dau **numai** prin variabile de mediu în Railway.
      Nu intră niciodată într-un fișier din depozit.

## 5. E-mailurile — nu pleacă niciunul fără Resend

Tot ce trimite site-ul pe e-mail trece prin Resend. **Fără `RESEND_API_KEY`,
niciun e-mail nu pleacă** — rutele răspund cinstit că trimiterea nu e activă și
dau telefonul, în loc să afișeze „am primit mesajul tău" pentru un mesaj care
n-a ajuns nicăieri. Nimic nu se pierde tăcut, dar nimic nu ajunge nici la
asociație.

- [ ] Verifică domeniul `teona-ariana.ro` în Resend (DNS: SPF, DKIM, DMARC).
- [ ] Pune `RESEND_API_KEY` în Railway → serviciul site → Variables.
- [ ] Opțional, `EMAIL_EXPEDITOR` dacă expeditorul trebuie să fie altul decât
      `Asociația Teona Ariana Suceava <contact@teona-ariana.ro>`. Trebuie să
      fie pe domeniul verificat, altfel Resend refuză.
- [ ] Trimite câte un mesaj de probă prin fiecare formular și verifică unde
      ajunge. Atenție la alias: `redirectionare@teona-ariana.ro` trebuie să
      funcționeze, altfel cererile de 3,5% nu ajung la nimeni.

Ce pleacă, și către cine:

| când | către om | către asociație |
|---|---|---|
| donație încasată (Stripe) | mulțumire, cu suma și destinația | — |
| formular de contact / voluntariat | confirmare de primire | mesajul complet, cu `reply-to` pe adresa lui |
| cerere de sponsorizare (20%) | pașii și datele de cont | datele firmei, la `contact@` și la fundraising |
| „trimite-mi pașii” (3,5%) | cei trei pași și linkul de completare online | evidență, la `redirectionare@` |
| campanie aniversară trimisă | linkul privat al paginii lui | „ai ceva de verificat" |
| campanie publicată / respinsă | adresa publică, ori motivul | — |

Mulțumirea pentru donație **nu e chitanță** și scrie asta în ea. Chitanța
fiscală o emite asociația.

Șabloanele se pot privi în dezvoltare, fără să trimită nimic nimănui:
`/api/proba-email?fel=…` (`o-data`, `lunar`, `reinnoire`, `sponsorizare`,
`redirectionare`, `campanie-trimisa`, `campanie-publicata`,
`campanie-respinsa`, și variantele `-anunt`). În producție ruta dă 404.

## 6. Ce mai lipsește de la asociație

Lista completă e în `continut/stadiu-caiet.md`. Site-ul funcționează fără ele,
dar secțiunile respective nu se afișează.
