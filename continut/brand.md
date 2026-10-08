# Brand — Asociația Teona Ariana Suceava

Extras din site-ul actual (`teona-ariana.ro`), prin citirea stilurilor aplicate,
nu din capturi de ecran. Astea sunt culorile și fonturile pe care le folosește
asociația azi — designul nou pleacă de la ele.

## Culori

| rol | hex | rgb | unde apare |
|---|---|---|---|
| **principal** | `#F74F22` | 247, 79, 34 | butoanele „Donează", accente, pata de culoare din antet |
| **secundar** | `#FFAC00` | 255, 172, 0 | titluri mici, pictograme, butonul „Vezi proiecte" |
| text închis | `#232323` | 35, 35, 35 | titluri și text principal |
| text secundar | `#616161` | 97, 97, 97 | paragrafe, descrieri |
| fundal cald | `#F9F5F2` | 249, 245, 242 | secțiuni alternate |
| alb | `#FFFFFF` | | fundalul de bază |

Portocaliul `#F74F22` e culoarea de identitate — apare de peste două ori mai des
decât oricare alta. Galbenul `#FFAC00` îl însoțește, niciodată singur.

Variabilele `--e-global-color-*` din pagină (`#6EC1E4`, `#61CE70` etc.) sunt
valorile din fabrică ale Elementor, nealese de nimeni. **Nu sunt culori de brand.**

## Fonturi

Site-ul actual încarcă **Quicksand** (principal), **Nunito Sans** (secundar) și
**Kalam** (cursiv, pentru „Nimic fără Dumnezeu").

**Site-ul nou folosește Nunito în locul lui Quicksand la titluri.** Motivul e
sigla: cuvintele „Asociația Teona Ariana" sunt scrise cu un sans rotunjit cu
„a" **cu două etaje**, iar Quicksand are „a" geometric **într-un singur etaj**
și e mult mai lat. Puse una lângă alta, sigla și titlurile se citeau ca două
scrisuri diferite. Comparația s-a făcut randând „Asociația Teona Ariana" în
Quicksand, Nunito, Nunito Sans, Baloo 2 și Fredoka alături de siglă — Nunito se
suprapune peste literele ei.

| font | folosire pe site-ul nou |
|---|---|
| **Nunito** (600–800) | titluri, meniu, butoane — se potrivește cu sigla |
| **Nunito Sans** (400–700) | textul lung; aceeași familie, mai neutră la paragraf |
| **Kalam** (cursiv) | accente scrise de mână, ca „Nimic fără Dumnezeu" |

Titlurile sunt la greutatea **800**: acolo Nunito are grosimea literelor siglei.

Toate trei sunt pe Google Fonts și se încarcă prin `next/font`, de pe domeniul
nostru — deci nicio cerere către Google la deschiderea paginii, deci niciun
cookie terț de cerut acord.

### Diacritice

Toate trei desenează **ă â î ș ț** și majusculele lor cu **virgulă dedesubt**,
nu cu sedilă — verificat prin randare, nu presupus. Se încarcă subsetul
`latin-ext`, fără de care ș și ț ar cădea pe un font de rezervă și s-ar vedea
dintr-un alt scris.

## Siglă

Sigla actuală: pasăre stilizată în degrade portocaliu-galben, cu textul
„Asociația Teona Ariana" în dreapta.

- antet: `public/poze/2024/03/WhatsApp_Image_2024-11-15_at_11.32.41_AM-removebg-preview.png` (436×161, fundal transparent)
- pictogramă de filă: `public/poze/2024/11/cropped-Screenshot11removebgpreview-2512x512-1-*.png` (32, 180, 192 px)

Fișierul din antet e un PNG venit dintr-o poză de WhatsApp, cu fundalul scos
automat — se vede la margini. **Pentru site-ul nou ar trebui refăcut vectorial
(SVG)**, în aceleași culori și cu aceeași formă. Așa arată bine la orice mărime
și cântărește câțiva kiloocteți.

## Motto

„Nimic fără Dumnezeu" — apare pe prima pagină, scris cu Kalam.
