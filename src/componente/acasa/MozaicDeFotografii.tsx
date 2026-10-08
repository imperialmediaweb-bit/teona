import Image from "next/image";
import { CONTINUT, GRILA, LINIE } from "./grila";

/**
 * Pagina dublă de fotografii, între Casa Teona și sponsori.
 *
 * Înlocuiește banda care se derula singură. Pozele stau pe loc, în grilă, la
 * mărimi diferite — două înalte pe margini, una lată sus în mijloc, două
 * pătrate sub ea — ca o pagină de revistă cu un reportaj foto. Nimic nu se
 * mișcă: pozele sunt destul de bune ca să țină singure pagina, iar pe un
 * site pentru copii cu hipersensibilitate vizuală o bandă în mișcare continuă
 * e exact lucrul de care ne ferim.
 *
 * Fără titlu și fără buton, ca și banda dinainte — singura secțiune în care
 * vorbesc doar fotografiile. Textele alternative descriu ce se vede în
 * fiecare poză, verificat cu ochii, nu ce ne-am dori să se vadă.
 */
const FOTOGRAFII = [
  {
    cale: "/poze/2024/11/438078420_2487218841475117_8011761126956602391_n.jpg",
    alt: "O voluntară învârte un copil în brațe, pe iarbă, în fața unei clădiri de lemn din tabără; părul îi flutură în vânt",
    zona: "a",
  },
  {
    cale: "/poze/2024/11/351164060_277811291485883_1768298065998774964_n.webp",
    alt: "Grup de copii și adulți în tabără, ținând litere care formează cuvântul „Mulțumim”, în fața unui perete de lemn",
    zona: "b",
  },
  {
    cale: "/poze/2024/11/438196694_1099567077821441_6735868067300369616_n-1.jpg",
    alt: "O voluntară desenează împreună cu un copil, la masă, între creioane colorate",
    zona: "c",
  },
  {
    // Originalul nedeformat; varianta `-1.webp` era întinsă pe lățime.
    cale: "/poze/2024/11/449517170_497189979548012_3324146063316341558_n.jpg",
    alt: "Copii și voluntari cu căști portocalii și hamuri de escaladă, într-un parc de aventură din tabără",
    zona: "d",
  },
  {
    cale: "/poze/2024/11/413839128_386434587290219_1905121098743660996_n.jpg",
    alt: "Voluntari în veste albe cu sigla asociației, în grup, la apus",
    zona: "e",
  },
] as const;

/**
 * Pozițiile în grilă, pe ecran lat și pe telefon.
 *
 *   lat:            telefon:
 *   a b b c         a b
 *   a d e c         a c
 *                   d e
 */
const ZONE: Record<(typeof FOTOGRAFII)[number]["zona"], string> = {
  a: "col-span-1 row-span-2 lg:col-span-3 lg:row-span-2",
  b: "col-span-1 lg:col-span-6",
  c: "col-span-1 lg:col-span-3 lg:row-span-2 lg:col-start-10 lg:row-start-1",
  d: "col-span-1 lg:col-span-3 lg:col-start-4 lg:row-start-2",
  e: "col-span-1 lg:col-span-3 lg:col-start-7 lg:row-start-2",
};

export default function MozaicDeFotografii() {
  return (
    <section
      aria-label="Fotografii din tabere și de la Casa Teona"
      className={`${GRILA} bg-hartie py-16 lg:py-24`}
    >
      <ul
        className={`${CONTINUT} grid auto-rows-[11rem] grid-cols-2 gap-3 border-t ${LINIE} pt-6 sm:auto-rows-[14rem] lg:auto-rows-[17rem] lg:grid-cols-12 lg:gap-4`}
      >
        {FOTOGRAFII.map((f) => (
          <li key={f.cale} className={`relative overflow-hidden bg-hartie-umbra ${ZONE[f.zona]}`}>
            <Image
              src={f.cale}
              alt={f.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 50vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
