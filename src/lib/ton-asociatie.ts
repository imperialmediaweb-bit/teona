/**
 * Cum scrie asociația. Scris o dată, de aici citesc toate celelalte.
 *
 * **De unde vine.** Nu l-am compus eu. Pe 16 octombrie 2026 asociația a trimis
 * un document cu 22 de modificări, iar două dintre ele erau texte scrise de
 * mâna lor, nu cereri: fraza de pe „Donează-ți ziua de naștere" și fraza de la
 * „Despre noi". Alea sunt singurul eșantion adevărat al vocii lor, și de aceea
 * stau mai jos cuvânt cu cuvânt, nu rezumate.
 *
 * **De ce contează.** Textele site-ului se scriu din trei locuri: eu, ei (din
 * panou) și modelul care face prima ciornă. Trei mâini, trei registre. Al meu
 * e cel mai lung și cel mai explicativ — îmi vine să scriu de ce funcționează
 * ceva într-un fel, când omul voia să afle ce are de făcut. Dacă nu stă scris
 * nicăieri cum scriu ei, site-ul se umple încet de felul meu de a scrie, și
 * asociația rămâne cu un site care nu mai vorbește ca ea.
 *
 * **Regulile sunt citite din frazele lor, nu inventate peste ele.** Fiecare
 * are dedesubt bucata din care s-a citit. Dacă asociația își schimbă felul de
 * a scrie, se schimbă frazele de aici și tot restul vine după.
 *
 * **Perechea „așa nu / așa da" nu e decor**, și nu e nici închipuită: fraza de
 * la „așa nu" a stat pe site-ul ăsta, scrisă de mine. Un model — și un om — își
 * schimbă scrisul mai mult de la un exemplu contrastant decât de la zece
 * reguli abstracte.
 */

/**
 * Cele două fraze ale asociației, verbatim.
 *
 * Nu se îndreaptă și nu se scurtează. Liniuța din prima e cum au scris-o ei.
 */
export const FRAZELE_LOR = [
  {
    unde: "Donează-ți ziua de naștere",
    text: "E ziua ta și vrei să o sărbătorești cu sens. Spune-le prietenilor că, în loc de cadou, îți dorești să ajuți copiii cu nevoi speciale. Îți faci o pagină cu poză și câteva cuvinte despre inițiativa ta și o distribui – e atât de simplu.",
  },
  {
    unde: "Despre noi",
    text: "Sprijinim copiii cu nevoi speciale și pe părinții lor prin tabere, terapie prin joacă și consiliere.",
  },
] as const;

/**
 * Ce se vede în frazele lor.
 *
 * `din` e bucata din care s-a citit regula — ca să se poată verifica, nu
 * crede pe cuvânt.
 */
export const REGULI = [
  {
    regula: "Vorbește cu omul, cu „tu”",
    din: "E ziua ta și vrei să o sărbătorești cu sens.",
    lamurire:
      "Nu „dumneavoastră”, nu „donatorul poate”. Un text la persoana a treia se citește ca un regulament.",
  },
  {
    regula: "Firmelor, „dumneavoastră”",
    din: "Amândouă frazele lor sunt scrise către un om, nu către o firmă.",
    lamurire:
      "Singura excepție. Paginile de sponsorizare rămân cum sunt: acolo e o scrisoare de afaceri.",
  },
  {
    regula: "Începe de la el, nu de la noi",
    din: "E ziua ta…",
    lamurire:
      "Prima frază e despre ce i se întâmplă lui. Despre asociație se află după.",
  },
  {
    regula: "Propoziții scurte, una după alta",
    din: "Trei propoziții, nu una cu liniuțe și paranteze.",
    lamurire:
      "Dacă o frază are nevoie de o liniuță ca să se termine, sunt două fraze.",
  },
  {
    regula: "Spune ce face omul, cu verbe",
    din: "Spune-le prietenilor… Îți faci o pagină… o distribui.",
    lamurire:
      "Nu „se poate crea o pagină personalizată”. El face lucrul, deci el e subiectul.",
  },
  {
    regula: "Numește lucrurile pe nume",
    din: "…prin tabere, terapie prin joacă și consiliere.",
    lamurire:
      "Trei lucruri care se văd, nu „servicii integrate de sprijin”. Fraza lor n-are nici un adjectiv.",
  },
  {
    regula: "Nu explica de ce merge așa",
    din: "– e atât de simplu.",
    lamurire:
      "Omul vrea să știe ce are de făcut, nu de ce site-ul e făcut cum e. Explicațiile astea sunt greșeala mea, nu a lor.",
  },
  {
    regula: "Dacă e simplu, spune că e simplu",
    din: "– e atât de simplu.",
    lamurire:
      "Fără semne de exclamare și fără „suntem încântați să vă anunțăm”. Calm, nu entuziast.",
  },
  {
    regula: "Nicio cifră pe care n-o știi",
    din: "Niciuna din frazele lor n-are cifre.",
    lamurire:
      "E site-ul unei asociații de copii cu dizabilități: o cifră greșită o costă încrederea. Lasă un gol și întreabă.",
  },
] as const;

/**
 * Bucata care pleacă spre model, când scrie o ciornă.
 *
 * Aceeași voce și pentru ciorna din panou și pentru orice altă cale spre
 * model care scrie text pentru site. Scrisă o dată: dacă ar fi scrisă de două
 * ori, una din copii s-ar strica fără să observe nimeni.
 */
export const CUM_SCRIE_ASOCIATIA = `CUM SCRIE ASOCIAȚIA

Nu scrii în felul tău. Scrii în felul lor. Mai jos sunt două fraze scrise de ei, cuvânt cu cuvânt — ăsta e tonul, nu o sugestie:

„${FRAZELE_LOR[0].text}"

„${FRAZELE_LOR[1].text}"

Ce se vede în ele, și ce faci la fel:

- **Vorbești cu omul, cu „tu".** Nu „dumneavoastră", nu „donatorul poate". Un text la persoana a treia se citește ca un regulament.
- **Excepția, singura:** firmelor li se scrie cu „dumneavoastră". Paginile de sponsorizare și formularele pentru firme rămân așa cum sunt — acolo e o scrisoare de afaceri, iar „tu" ar suna nelalocul lui. Amândouă frazele asociației sunt scrise către un om, nu către o firmă.
- **Începi de la el, nu de la asociație.** Prima frază e despre ce i se întâmplă lui.
- **Propoziții scurte, una după alta.** Dacă o frază are nevoie de o liniuță sau de o paranteză ca să se termine, sunt două fraze.
- **Spui ce face el, cu verbe:** „îți faci o pagină", „o distribui", „suni". Nu „se poate crea o pagină personalizată".
- **Numești lucrurile pe nume:** tabere, terapie prin joacă, consiliere. Fraza lor despre tot ce face asociația n-are nici un adjectiv.
- **Nu explici de ce merge așa.** Omul vrea să știe ce are de făcut. De ce e făcut lucrul într-un fel anume nu-l interesează și nu-i folosește.
- **Dacă e simplu, spui că e simplu.** Fără semne de exclamare, fără „suntem încântați să vă anunțăm". Calm, nu entuziast.
- **Nu scrii despre copii ca despre niște sărmani.** Sunt copii.
- **Fără superlative și fără semne de exclamare în lanț.**
- **Nu promiți ce nu ți s-a spus că se întâmplă.** Nici un loc în tabără, nici o dată, nici o sumă.

AȘA NU (fraza asta a stat pe site, scrisă de mine):

„Fiecare pagină e citită de cineva din asociație înainte să apară public — e site-ul unei asociații de copii, iar textele și pozele nu pot apărea nevăzute."

AȘA DA:

„O citim înainte s-o publicăm. De obicei durează câteva ore, în zilele lucrătoare, și îți scriem pe e-mail când e gata."`;
