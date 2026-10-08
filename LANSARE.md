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
      `https://teona-ariana.ro` (sau șterge variabila; valoarea implicită din
      `src/app/seo.tsx` e tot domeniul real).
- [ ] Așteaptă redeploy-ul și verifică:
      `curl https://teona-ariana.ro/robots.txt` → trebuie `Allow: /`
      `curl -s https://teona-ariana.ro/ | grep 'name="robots"'` → **nimic**
- [ ] `curl -s https://teona-ariana.ro/ | grep canonical` → `https://teona-ariana.ro`
- [ ] Trimite `https://teona-ariana.ro/sitemap.xml` în Google Search Console.

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

## 5. Ce mai lipsește de la asociație

Lista completă e în `continut/stadiu-caiet.md`. Site-ul funcționează fără ele,
dar secțiunile respective nu se afișează.
