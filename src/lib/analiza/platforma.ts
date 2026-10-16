import {
  ASOCIATIA,
  CIFRE,
  CONTACT_FIRME,
  CONTURI,
  LINKURI_EXTERNE,
  RUTE,
  SMS,
} from "@/date/asociatie";

/**
 * Ce poate face platforma asta — scris pentru consultantul de fundraising.
 *
 * **De ce îi trebuie.** Un consultant care nu știe ce unelte are la îndemână
 * dă sfaturi de manual: „construiți o campanie de retenție", „segmentați
 * baza". Unul care știe că există deja pagini de ziua ta, un calculator
 * pentru firme, două șabloane de e-mail gata construite și un formular de
 * transfer anunțat, spune în schimb ce buton să apese omul luni dimineață.
 *
 * **De ce stă separat de cifre.** Partea asta nu se schimbă de la o lună la
 * alta, deci se păstrează în cache-ul API-ului și nu se mai plătește la
 * fiecare întrebare. Cifrele, care se schimbă, merg în mesaj.
 *
 * **Ce nu scrie aici.** Nimic despre vreun donator. Fișierul e o descriere a
 * uneltelor, nu a oamenilor.
 */

const lista = (x: readonly string[]) => x.map((l) => `- ${l}`).join("\n");

export const CE_POATE_PLATFORMA = `UNELTELE CARE EXISTĂ DEJA PE SITE

Pagini publice prin care intră bani:
${lista([
  `${RUTE.doneaza} — donație cu cardul (Stripe), o dată sau lunară; PayPal în euro; transfer bancar cu toate conturile, unde donatorul poate anunța singur că a făcut transferul.`,
  `${RUTE.redirectionare35} — 3,5% din impozitul pe venit, Formularul 230. Termenul legal e 25 mai, pentru veniturile anului trecut. Se poate completa online, pe ecran, sau pe hârtie.`,
  `${RUTE.directionare20} — 20% din impozitul pe profit pentru firme, cu un calculator care ia cifra de afaceri și impozitul din ultimul bilanț depus la ANAF, după CUI, și scoate suma maximă. De acolo firma își descarcă pe loc contractul de sponsorizare completat, în Word sau PDF.`,
  `${RUTE.ziuaTa} — „donează-ți ziua": omul își face o pagină de strângere de fonduri de ziua lui, cu poza și textul lui, pe care o trimite prietenilor. Trece prin aprobare în panou.`,
  `SMS: ${SMS.text} la ${SMS.numar}, ${SMS.sumaLunara} pe lună, cu oprire gratuită.`,
  `Galantom, pentru cine preferă platforma lor: ${LINKURI_EXTERNE.galantom}`,
])}

Ce poate face asociația din panou, fără programator:
${lista([
  '/admin/scrie — scrie noutăți și campanii pe site, cu poze. Rămân ciornă până la „Publică".',
  "/admin/sabloane — două șabloane de e-mail gata construite, unul pentru persoane fizice (cu toate căile de a ajuta: card, sume fixe, lunar, 3,5%, SMS, transfer, ziua ta, voluntariat, Galantom, distribuire) și unul pentru firme (calculator, contract, Declarația 177, omul de la fundraising). Se schimbă doar titlul, textul și poza; se descarcă HTML-ul sau se face ciorna direct în MailerLite.",
  "/admin/rapoarte — PDF lunar (intern, cu nume), anual și pe campanie (fără date personale, de atașat la un e-mail).",
  "/admin/donatii — confirmarea transferurilor anunțate de donatori, din extrasul de cont.",
  "/admin/firme — pâlnia firmelor, cu stadii, și generarea contractului de sponsorizare din fișa firmei.",
  "/admin/cereri — mesajele de contact, cererile de voluntariat și cele de redirecționare 3,5%, cu stadii.",
  "/admin/aniversari — aprobarea paginilor de ziua cuiva.",
  "Export în Excel pentru donații, donatori, firme și cereri.",
  'Segmente gata făcute: „s-au oprit" (au dat de cel puțin două ori, nimic în ultimele patru luni) și „donatori mari" (peste 1.000 de lei adunat).',
])}

Ce se trimite automat, fără ca nimeni să apese ceva:
${lista([
  "mulțumire după fiecare donație, cu suma, data și destinația;",
  "mulțumire la fiecare reînnoire lunară;",
  "cu câteva zile înainte de fiecare reînnoire lunară, o veste: cine rămâne n-are nimic de făcut, cine vrea să oprească are butonul chiar în mesaj;",
  "confirmare și pașii la cererile de 3,5% și la cele de sponsorizare;",
  "confirmare la mesajele de contact și la cererile de voluntariat;",
  "anunțuri către asociație la fiecare cerere nouă.",
])}

Buletinele și campaniile de e-mail se trimit din MailerLite, nu din panou. Pe listă intră numai cine a bifat acordul; donatorii mai vechi nu au acordul înregistrat și nu pot fi adăugați retroactiv.

CALENDARUL FISCAL ROMÂNESC, pentru planificare:
${lista([
  "25 mai — termenul Formularului 230, pentru 3,5% din impozitul pe venitul anului trecut. Singurul termen pe care îl știm sigur; e în lege și e scris pe site.",
  "Firmele pot direcționa 20% din impozitul pe profit, cel mult 0,75% din cifra de afaceri — se ia suma mai mică dintre cele două. Termenul de depunere al Declarației 177 depinde de situația fiscală a firmei și nu e scris pe site: îl confirmă contabilitatea firmei.",
])}

CE FACE ASOCIAȚIA, în cifrele ei verificate:
${lista([
  `${CIFRE[0].valoare} de tabere organizate, cu peste ${CIFRE[1].valoare.toLocaleString("ro-RO")} de participanți;`,
  `peste ${CIFRE[2].valoare} de copii vin la Casa Teona;`,
  `peste ${CIFRE[3].valoare} de voluntari au trecut pe aici;`,
  `taberele RESPIRO sunt pentru copii cu nevoi speciale și copii care au trecut prin cancer, împreună cu părinții lor;`,
  `${ASOCIATIA.denumire}, CIF ${ASOCIATIA.cif}, conturi la ${[...new Set(CONTURI.map((c) => c.banca))].join(" și ")};`,
  `de firme se ocupă ${CONTACT_FIRME[0].nume}, ${CONTACT_FIRME[0].rol.toLowerCase()}.`,
])}

CE NU SE POATE, și n-are rost recomandat:
${lista([
  "nu există buget de reclamă plătită și nici agenție;",
  "nu există echipă: una-două persoane fac strângerea de fonduri, comunicarea și evidența;",
  "nu se pot adăuga retroactiv donatori pe lista de buletin — nu au acordul;",
  "site-ul nu poate ști dacă un transfer bancar a intrat; îl confirmă un om din extrasul de cont;",
  "nu avem date despre vârsta, orașul sau veniturile donatorilor, și nu le culegem.",
])}`;
