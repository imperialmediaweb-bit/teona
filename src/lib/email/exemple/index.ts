import { construiesteMultumirea } from "../donatie";
import { compuneIntrare } from "../cont";
import { compuneAnunt, compuneHotarare, compuneTrimisa } from "../campanie";
import {
  compuneAnuntFormular230,
  compuneAnuntRedirectionare,
  compuneAnuntSponsorizare,
  compuneFormular230,
  compuneRedirectionare,
  compuneSponsorizare,
} from "../formulare";
import { compuneContractulNesemnat } from "../contract";
import { compuneAnuntTransfer, compuneTransferAnuntat } from "../transfer";
import {
  compuneConfirmareaDeContact,
  compuneMesajulDeContact,
} from "../contact";

/**
 * O zi de probă, fixă.
 *
 * Mesajele care poartă o dată (un transfer anunțat, mulțumirea pentru el) ar
 * arăta altfel la fiecare deschidere a paginii dacă data venea din ceasul
 * serverului. Aici nu se verifică un ceas, se verifică un text — iar o dată
 * care sare dintr-o zi în alta îl face greu de comparat cu ce era ieri.
 */
const ZI_DE_PROBA = "2026-03-04T12:00:00.000Z";

/**
 * Toate mesajele pe care le trimite site-ul, compuse cu date de probă.
 *
 * **La ce folosește.** Până acum, singurul fel de a vedea ce primește un
 * donator după ce donează era să donezi. Mesajele astea pleacă automat, în
 * numele asociației, și nimeni nu le vedea niciodată — iar o greșeală într-unul
 * dintre ele (un telefon vechi, o frază neterminată) ar fi stat acolo ani.
 *
 * Datele sunt de probă și arată că sunt: „Maria Popescu", „Firma de probă SRL".
 * Nicio adresă adevărată, niciun donator adevărat.
 */

export type Exemplu = {
  id: string;
  titlu: string;
  cand: string;
  catre: "om" | "asociatie";
  compus: { subiect: string; html: string; text: string };
};

export function exemple(): Exemplu[] {
  return [
    {
      id: "multumire",
      titlu: "Mulțumire după donație",
      cand: "Imediat ce plata a trecut, prin card sau PayPal.",
      catre: "om",
      compus: construiesteMultumirea({
        email: "maria@exemplu.ro",
        prenume: "Maria",
        nume: "Popescu",
        sumaBani: 15000,
        moneda: "RON",
        frecventa: "lunar",
        destinatie: "tabere",
      }),
    },
    {
      id: "multumire-reinnoire",
      titlu: "Mulțumire la reînnoirea lunară",
      cand: "În fiecare lună, când se ia din nou suma de pe card.",
      catre: "om",
      compus: construiesteMultumirea({
        email: "maria@exemplu.ro",
        prenume: "Maria",
        nume: "Popescu",
        sumaBani: 15000,
        moneda: "RON",
        frecventa: "lunar",
        destinatie: "tabere",
        reinnoire: true,
      }),
    },
    {
      id: "multumire-fara-nume",
      titlu: "Mulțumire când donatorul n-a scris prenumele",
      cand: "Același mesaj, dar începe cu „Bună,” — cum cere caietul (1.6).",
      catre: "om",
      compus: construiesteMultumirea({
        email: "cineva@exemplu.ro",
        prenume: null,
        nume: null,
        sumaBani: 5000,
        moneda: "RON",
        frecventa: "o-data",
        destinatie: "oriunde",
      }),
    },
    {
      id: "contact",
      titlu: "Am primit mesajul tău",
      cand: "Când cineva scrie din formularul de contact.",
      catre: "om",
      compus: compuneConfirmareaDeContact({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        voluntariat: false,
      }),
    },
    {
      id: "voluntariat",
      titlu: "Am primit cererea ta de voluntariat",
      cand: "Când cineva se oferă voluntar de pe Devino voluntar.",
      catre: "om",
      compus: compuneConfirmareaDeContact({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        voluntariat: true,
      }),
    },
    {
      id: "transfer-anuntat",
      titlu: "Am notat transferul bancar anunțat",
      cand: "Când donatorul bifează pe /doneaza că a făcut transferul.",
      catre: "om",
      compus: compuneTransferAnuntat({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        sumaBani: 20000,
        destinatie: "tabere",
        data: ZI_DE_PROBA,
      }),
    },
    {
      id: "multumire-transfer",
      titlu: "Mulțumire după ce transferul s-a găsit în extras",
      cand: "Când cineva apasă „Am găsit-o în extras” în panou.",
      catre: "om",
      compus: construiesteMultumirea({
        email: "maria@exemplu.ro",
        prenume: "Maria",
        nume: "Popescu",
        sumaBani: 20000,
        moneda: "RON",
        frecventa: "o-data",
        destinatie: "tabere",
        cand: ZI_DE_PROBA,
        prinTransfer: true,
      }),
    },
    {
      id: "formular-230",
      titlu: "Formularul 230 completat pe hârtie",
      cand: "Când cineva anunță pe /formular-230 că l-a completat.",
      catre: "om",
      compus: compuneFormular230({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        ani: 2,
      }),
    },
    {
      id: "intrare-cont",
      titlu: "Intrarea în „contul meu”",
      cand: "Când un donator cere linkul ca să-și vadă donațiile.",
      catre: "om",
      compus: compuneIntrare({
        email: "maria@exemplu.ro",
        jeton: "jeton-de-proba",
        numeMic: "Maria",
      }),
    },
    {
      id: "redirectionare",
      titlu: "Pașii pentru 3,5% din impozit",
      cand: "Când cineva cere pașii de pe pagina Redirecționează 3,5%.",
      catre: "om",
      compus: compuneRedirectionare({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        preferinta: "Completez online",
      }),
    },
    {
      id: "sponsorizare",
      titlu: "Răspuns la cererea unei firme",
      cand: "Când o firmă trimite formularul de sponsorizare.",
      catre: "om",
      compus: compuneSponsorizare({
        firma: "Firma de probă SRL",
        cui: "43533953",
        persoana: "Ion Probă",
        email: "contact@firma-de-proba.ro",
        telefon: "07xx xxx xxx",
        cale: "Contract de sponsorizare",
        suma: "5.000",
      }),
    },
    {
      id: "contract",
      titlu: "Contractul completat, pe e-mail",
      cand: "Când o firmă își descarcă contractul de pe site și lasă adresa.",
      catre: "om",
      compus: compuneContractulNesemnat({
        denumire: "Firma de probă SRL",
        reprezentant: "Ion Probă",
        email: "contact@firma-de-proba.ro",
        valoare: "5.000",
      }),
    },
    {
      id: "aniversare-trimisa",
      titlu: "Campania de ziua ta a plecat spre verificare",
      cand: "Imediat ce cineva își trimite campania de ziua lui.",
      catre: "om",
      compus: compuneTrimisa({
        email: "maria@exemplu.ro",
        numePublic: "Maria P.",
        titlu: "Ziua Mariei",
        slug: "ziua-mariei",
        jeton: "jeton-de-proba",
      }),
    },
    {
      id: "aniversare-publicata",
      titlu: "Campania de ziua ta a fost publicată",
      cand: "Când cineva din asociație o aprobă.",
      catre: "om",
      compus: compuneHotarare({
        email: "maria@exemplu.ro",
        numePublic: "Maria P.",
        titlu: "Ziua Mariei",
        slug: "ziua-mariei",
        publicata: true,
      }),
    },
    {
      id: "aniversare-respinsa",
      titlu: "Campania de ziua ta n-a fost publicată",
      cand: "Când cineva din asociație o respinge, cu un motiv.",
      catre: "om",
      compus: compuneHotarare({
        email: "maria@exemplu.ro",
        numePublic: "Maria P.",
        titlu: "Ziua Mariei",
        slug: "ziua-mariei",
        publicata: false,
        motiv: "Poza nu se vedea. Trimite-o din nou și o publicăm.",
      }),
    },
    {
      id: "anunt-aniversare",
      titlu: "O campanie nouă, de verificat",
      cand: "Către asociație, când cineva trimite o campanie de ziua lui.",
      catre: "asociatie",
      compus: compuneAnunt({
        numePublic: "Maria P.",
        titlu: "Ziua Mariei",
        email: "maria@exemplu.ro",
      }),
    },
    {
      id: "anunt-sponsorizare",
      titlu: "O firmă vrea să sponsorizeze",
      cand: "Către asociație, la fiecare formular de sponsorizare.",
      catre: "asociatie",
      compus: compuneAnuntSponsorizare({
        firma: "Firma de probă SRL",
        cui: "43533953",
        persoana: "Ion Probă",
        email: "contact@firma-de-proba.ro",
        telefon: "07xx xxx xxx",
        cale: "Declarația 177",
        suma: "5.000",
        mesaj: "Vrem să susținem o tabără.",
      }),
    },
    {
      id: "anunt-contact",
      titlu: "Mesaj nou de pe site",
      cand: "Către asociație, la fiecare mesaj din formularul de contact.",
      catre: "asociatie",
      compus: compuneMesajulDeContact({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        voluntariat: false,
        campuri: [
          ["Nume", "Maria Popescu"],
          ["E-mail", "maria@exemplu.ro"],
          ["Telefon", "07xx xxx xxx"],
          ["Mesaj", "Aș vrea să ajut cu transportul la tabere."],
        ],
      }),
    },
    {
      id: "anunt-voluntariat",
      titlu: "Cerere nouă de voluntariat",
      cand: "Către asociație, la fiecare cerere de voluntariat.",
      catre: "asociatie",
      compus: compuneMesajulDeContact({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        voluntariat: true,
        campuri: [
          ["Nume", "Maria Popescu"],
          ["E-mail", "maria@exemplu.ro"],
          ["Telefon", "07xx xxx xxx"],
          ["Localitate", "Suceava"],
          ["Data nașterii", "1998-04-12"],
          ["Disponibilitate", "Weekenduri"],
          ["Experiență cu copii", "Da, am lucrat la o grădiniță"],
          ["Permis", "Da, categoria B"],
          ["Motivul", "Vreau să fiu de folos aproape de casă."],
        ],
      }),
    },
    {
      id: "anunt-transfer",
      titlu: "Un transfer de căutat în extras",
      cand: "Către asociație, imediat ce donatorul îl anunță.",
      catre: "asociatie",
      compus: compuneAnuntTransfer({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        sumaBani: 20000,
        destinatie: "tabere",
        data: ZI_DE_PROBA,
        observatii: "Am scris „donație tabere” la detalii.",
      }),
    },
    {
      id: "anunt-formular-230",
      titlu: "Cineva a completat Formularul 230 pe hârtie",
      cand: "Către asociație, ca să știe pe cine așteaptă cu hârtia.",
      catre: "asociatie",
      compus: compuneAnuntFormular230({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        ani: 2,
      }),
    },
    {
      id: "anunt-redirectionare",
      titlu: "Cineva a cerut pașii pentru 3,5%",
      cand: "Către asociație, la fiecare cerere.",
      catre: "asociatie",
      compus: compuneAnuntRedirectionare({
        nume: "Maria Popescu",
        email: "maria@exemplu.ro",
        telefon: "07xx xxx xxx",
        preferinta: "Vreau formularul pe hârtie",
      }),
    },
  ];
}

export function exemplu(id: string): Exemplu | undefined {
  return exemple().find((e) => e.id === id);
}
