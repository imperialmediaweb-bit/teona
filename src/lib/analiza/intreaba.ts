import { cate } from "@/lib/numere-ro";
import { scrieSuma } from "@/lib/suma";
import type { Vizite } from "@/lib/ga/raport";
import type {
  Campanie,
  Canalul,
  ProfilDonatori,
  ProfilFirme,
} from "./cifre";
import { numeCanal } from "@/lib/atribuire";
import type { Reclame } from "@/lib/reclame/meta";

/**
 * Analiza cifrelor, cerută unui model de limbaj.
 *
 * **Ce pleacă de aici.** Numai textul construit de `rezumat()`: numărători,
 * sume și procente. Niciun nume, niciun e-mail, niciun telefon, niciun CUI,
 * nicio donație individuală. Funcția e singurul loc prin care datele ies către
 * API-ul Anthropic, și e scrisă ca să poată fi citită de cineva care vrea să
 * verifice exact asta — de aceea construiește șirul rând cu rând, în loc să
 * serializeze un obiect din care, peste un an, cineva ar putea să nu observe
 * că a apărut un câmp cu nume.
 *
 * **Ce i se cere.** Să interpreteze, nu să calculeze și nici să imagineze.
 * Cifrele sunt în text; dacă îi lipsește una, scrie că îi lipsește. Pentru o
 * asociație de copii cu dizabilități, o cifră inventată într-un document care
 * ajunge la un finanțator costă mai mult decât ajută o analiză frumoasă.
 *
 * **La ce răspunde.** Nu „cum stăm" — asta spune tabloul de bord. Ci ce se
 * vede în cifre și nu sare în ochi: dacă oamenii se întorc sau nu, unde se
 * pierde pâlnia firmelor, ce merită încercat luna viitoare.
 */

const MODEL = "claude-sonnet-5-5";
const PLAFON_RASPUNS = 3000;

/*
  Adresa API-ului, cu o portiță pentru probe.

  `scripts/qa/analiza.mjs` pornește un server care imită API-ul Anthropic și
  se uită la ce i se trimite — adică exact la lucrul care contează aici: că în
  cerere nu pleacă niciun nume și niciun e-mail. Fără portița asta, singurul
  fel de a verifica asta ar fi să citești codul și să-l crezi pe cuvânt.
  Aceeași soluție ca la Cloudinary, cu `CLOUDINARY_API`.
*/
const API =
  process.env.ANTHROPIC_API?.replace(/\/+$/, "") ?? "https://api.anthropic.com";

export function areAnaliza(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function lei(bani: number): string {
  return scrieSuma(bani / 100);
}

/** „mai puțin de o zi" sună a realitate; „0 zile" sună a câmp necompletat. */
function zile(n: number): string {
  return n === 0 ? "mai puțin de o zi" : cate(n, "zi", "zile");
}

function procent(parte: number, intreg: number): string {
  if (intreg <= 0) return "nu se poate calcula";
  return `${Math.round((parte / intreg) * 100)}%`;
}

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/**
 * Cifrele, scrise în cuvinte.
 *
 * Tot ce trimitem. Dacă vrei să știi ce află modelul despre asociație, citești
 * funcția asta — nu e nimic altundeva.
 */
export function rezumat(
  d: ProfilDonatori,
  f: ProfilFirme,
  v?: Vizite | null,
  c?: {
    lista: Campanie[];
    faraEticheta: number;
    baniFaraEticheta: number;
  } | null,
  can?: {
    lista: Canalul[];
    nelegate: number;
    baniNelegate: number;
  } | null,
  rec?: Reclame | null,
): string {
  const randuri: string[] = [];

  randuri.push("DONATORI");
  randuri.push(
    `- ${cate(d.donatori, "donator", "donatori")} (oameni diferiți, după adresa de e-mail), ${cate(d.donatii, "donație", "donații")} încasate, ${lei(d.totalBani)} în total`,
  );
  randuri.push(
    `- donația medie ${lei(d.donatieMedie)}, mediana ${lei(d.donatieMediana)}`,
  );
  randuri.push(
    `- au dat o singură dată: ${d.oSinguraData}; de două-trei ori: ${d.deDouaSauTrei}; de patru sau mai multe ori: ${d.dePatruSauMaiMulte}`,
  );
  randuri.push(
    `- donatori la prima donație în ultimele 12 luni: ${d.noiUltimeleLuni}`,
  );
  randuri.push(
    d.zilePanaLaADoua === null
      ? "- încă nimeni n-a donat a doua oară, deci nu se poate spune cât trece între prima și a doua donație"
      : `- între prima și a doua donație trece, la mijloc, ${zile(d.zilePanaLaADoua)}`,
  );
  randuri.push(
    `- dintre cei a căror primă donație a fost acum 12–24 de luni, ${d.reveniti} au mai donat în ultimele 12 luni`,
  );
  randuri.push(
    `- plăți lunare active (încasate în ultimele 35 de zile): ${cate(d.recurentiActivi, "donator", "donatori")}, ${lei(d.baniRecurentiPeLuna)} pe lună`,
  );
  randuri.push(
    `- s-au oprit (au dat de cel puțin două ori, nimic în ultimele patru luni): ${d.sAuOprit}`,
  );
  randuri.push(
    `- donatori mari (peste 1.000 de lei adunat): ${d.donatoriMari}, cu ${lei(d.baniDeLaMari)} în total, adică ${procent(d.baniDeLaMari, d.totalBani)} din bani`,
  );
  randuri.push(
    `- au bifat acordul pentru buletinul informativ: ${d.cuAcord} din ${d.donatori}`,
  );
  randuri.push(
    `- donații care poartă eticheta unei campanii: ${d.prinCampanii} din ${d.donatii}`,
  );
  randuri.push(
    `- donatori pe tranșe de total adunat: ${d.peTranse
      .map((t) => `${t.eticheta}: ${t.donatori}`)
      .join("; ")}`,
  );
  randuri.push(
    `- bani pe destinații: ${d.peDestinatii
      .map((x) => `${x.eticheta} ${lei(x.bani)}`)
      .join("; ")}`,
  );
  randuri.push(
    `- bani pe căi de plată: ${d.peMetode
      .map((x) => `${x.eticheta} ${lei(x.bani)}`)
      .join("; ")}`,
  );
  if (d.peLuniAleAnului.length > 0) {
    randuri.push(
      `- bani pe luni ale anului, toți anii la un loc: ${d.peLuniAleAnului
        .map((l) => `${LUNI[l.luna - 1]} ${lei(l.bani)}`)
        .join("; ")}`,
    );
  }
  if (d.deverificat > 0) {
    randuri.push(
      `- ${cate(d.deverificat, "transfer anunțat de donator așteaptă", "transferuri anunțate de donatori așteaptă")} confirmarea din extrasul de cont și nu sunt numărate mai sus`,
    );
  }

  randuri.push("");
  randuri.push("FIRME");
  randuri.push(`- ${cate(f.firme, "firmă", "firme")} în evidență`);
  randuri.push(
    `- pe stadii: ${f.peStadii.map((s) => `${s.stadiu}: ${s.nr}`).join("; ")}`,
  );
  randuri.push(
    `- din toate firmele intrate, ${f.pastraDinCerere.semnate} au ajuns la contract semnat și ${f.pastraDinCerere.incasate} la bani încasați`,
  );
  randuri.push(
    `- total din sponsorizări încasate, după fișele completate de mână: ${lei(f.incasatBani)}; sponsorizarea medie ${lei(f.sponsorizareMedie)}`,
  );
  randuri.push(
    f.zilePanaLaBani === null
      ? "- nicio firmă n-a ajuns încă la bani încasați, deci nu se știe cât durează drumul"
      : `- de la cerere până la bani în cont trece, la mijloc, ${zile(f.zilePanaLaBani)}`,
  );
  randuri.push(
    `- de unde au venit: ${f.peCale.map((c) => `${c.cale}: ${c.nr}`).join("; ")}`,
  );
  randuri.push(
    `- blocate de peste două săptămâni în „cerere" sau „contract trimis": ${f.uitate}`,
  );

  /*
    Vizitele, dacă Google Analytics e legat.

    Fără ele, analiza se oprea de fiecare dată la aceeași concluzie: „nu se
    știe de unde vin oamenii". Cu ele, se poate pune întrebarea care contează
    — câți dintre cei care intră pe site ajung să doneze și de pe ce cale vin.

    Rămâne scris pe document că sunt două surse diferite: Google numără
    vizite, baza de date numără donații. Un model căruia nu i se spune asta
    le adună.
  */
  /*
    Campaniile, cu banii lângă vizite.

    Aici se vede ce a mers și ce n-a mers — singura întrebare al cărei
    răspuns schimbă ce face omul luna viitoare. Vizitele vin de la Google, pe
    eticheta UTM; donațiile din baza noastră, pe eticheta din link. Două
    surse diferite, puse una lângă alta: o campanie cu multe vizite și nicio
    donație e altceva decât una pe care n-a văzut-o nimeni, iar fără ambele
    cifre nu se poate spune care dintre ele e.
  */
  if (c && c.lista.length > 0) {
    randuri.push("");
    randuri.push("CAMPANII");
    const peNume = new Map(
      (v?.campanii ?? []).map((x) => [x.nume.toLowerCase(), x.sesiuni]),
    );
    for (const x of c.lista.slice(0, 15)) {
      const sesiuni =
        peNume.get(x.slug.toLowerCase()) ??
        peNume.get(x.titlu.toLowerCase()) ??
        null;
      const bucati = [
        `${cate(x.donatii, "donație", "donații")}`,
        lei(x.bani),
        `${cate(x.donatori, "donator", "donatori")}`,
      ];
      if (x.tintaBani) {
        bucati.push(
          `ținta era ${lei(x.tintaBani)} (strâns ${procent(x.bani, x.tintaBani)})`,
        );
      }
      if (sesiuni !== null) {
        bucati.push(
          `${cate(sesiuni, "vizită venită din linkul campaniei", "vizite venite din linkul campaniei")}`,
        );
        if (sesiuni > 0) {
          bucati.push(`din care au donat ${procent(x.donatii, sesiuni)}`);
        }
      }
      randuri.push(`- „${x.titlu}": ${bucati.join(", ")}`);
    }
    randuri.push(
      `- ${cate(c.faraEticheta, "donație a venit", "donații au venit")} fără eticheta vreunei campanii (${lei(c.baniFaraEticheta)}). Asta nu înseamnă că n-au venit dintr-o campanie — doar că n-am putut-o lega de una.`,
    );
    if ((v?.campanii ?? []).length === 0) {
      randuri.push(
        "- nu avem vizitele pe campanii de la Google: ori nu e legat Analytics, ori linkurile n-au purtat etichete UTM. Fără ele nu se poate spune dacă o campanie n-a adus bani fiindcă n-a văzut-o nimeni sau fiindcă n-a convins.",
      );
    }
  }

  /*
    De unde vin donatorii.

    Aceleași două surse, nicăieri adunate: vizitele le numără Google,
    donațiile baza noastră. Modelului i se spune răspicat, fiindcă e exact
    locul în care o însumare ar părea firească și ar fi greșită.
  */
  if (can && (can.lista.length > 0 || can.nelegate > 0)) {
    randuri.push("");
    randuri.push("DE UNDE VIN DONATORII");
    const vizitePe = new Map<string, number>(
      (v?.canale ?? []).map((x) => [x.canal as string, x.sesiuni]),
    );
    for (const x of can.lista) {
      const sesiuni = vizitePe.get(x.canal) ?? null;
      const bucati = [
        `${cate(x.donatii, "donație", "donații")}`,
        lei(x.bani),
        `${cate(x.donatori, "donator", "donatori")}`,
      ];
      if (sesiuni !== null) {
        bucati.push(`${cate(sesiuni, "vizită", "vizite")} (de la Google)`);
        if (sesiuni > 0) bucati.push(`au donat ${procent(x.donatii, sesiuni)}`);
      }
      randuri.push(`- ${numeCanal(x.canal)}: ${bucati.join(", ")}`);
    }
    for (const x of v?.canale ?? []) {
      if (can.lista.some((y) => y.canal === x.canal)) continue;
      randuri.push(
        `- ${numeCanal(x.canal)}: ${cate(x.sesiuni, "vizită", "vizite")}, nicio donație legată`,
      );
    }
    randuri.push(
      `- ${cate(can.nelegate, "donație nu are", "donații nu au")} niciun canal (${lei(can.baniNelegate)}): sunt cele dinainte ca site-ul să-l scrie, cele adăugate de mână din extrasul de cont și cele ale oamenilor care au scris adresa de mână. Nu se împart pe canale.`,
    );
  }

  if (rec) {
    randuri.push("");
    randuri.push(`RECLAME META (ultimele ${rec.zile} de zile)`);
    randuri.push(
      `- cheltuit ${lei(rec.cheltuitBani)}, ${rec.afisari} afișări, ${rec.apasari} apăsări (${rec.ctr.toFixed(1)}%), cost pe apăsare ${lei(rec.cpcBani)}`,
    );
    for (const x of rec.campanii.slice(0, 8)) {
      randuri.push(
        `- „${x.nume}": ${lei(x.cheltuitBani)}, ${x.apasari} apăsări, ${x.ctr.toFixed(1)}% au apăsat`,
      );
    }
    randuri.push(
      "- cheltuiala o spune Meta, donațiile baza noastră; costul pe donație iese din două măsurători diferite, deci e o apropiere, nu o cifră exactă.",
    );
  }

  if (v) {
    randuri.push("");
    randuri.push(
      `VIZITE PE SITE (Google Analytics, ultimele ${v.zile} de zile)`,
    );
    randuri.push(
      `- ${cate(v.utilizatori, "om a intrat", "oameni au intrat")} pe site, în ${cate(v.sesiuni, "vizită", "vizite")}, cu ${cate(v.vizualizari, "pagină văzută", "pagini văzute")}`,
    );
    randuri.push(
      `- perioada dinainte, la fel de lungă: ${v.inainte.utilizatori} oameni, ${v.inainte.sesiuni} vizite`,
    );
    if (v.surse.length > 0) {
      randuri.push(
        `- de unde au venit: ${v.surse.map((x) => `${x.sursa}: ${x.sesiuni}`).join("; ")}`,
      );
    }
    if (v.pagini.length > 0) {
      randuri.push(
        `- cele mai văzute pagini: ${v.pagini.map((x) => `${x.cale}: ${x.vizualizari}`).join("; ")}`,
      );
    }
    if (v.campanii.length > 0) {
      randuri.push(
        `- vizite venite din linkuri etichetate de campanie: ${v.campanii.map((x) => `${x.nume}: ${x.sesiuni}`).join("; ")}`,
      );
    }
    randuri.push(
      "- atenție: cifrele de vizite vin de la Google și numără vizite, nu donații. Donațiile de mai sus vin din baza de date. Nu le aduna și nu presupune că o vizită și o donație sunt același om.",
    );
  }

  return randuri.join("\n");
}

const INSTRUCTIUNI = `Ești consultant de strângere de fonduri. Lucrezi pentru Asociația Teona Ariana Suceava, o asociație mică din Suceava care organizează tabere RESPIRO pentru copii cu nevoi speciale și copii care au trecut prin cancer, și ține deschisă Casa Teona.

Primești cifrele agregate ale donatorilor și firmelor. Scrii pentru managerul de fundraising al asociației — un om care face și strângerea de fonduri, și comunicarea, și evidența, singur. Nu are timp de teorie și nu are buget de agenție.

Scrii în română, cu diacritice corecte (ă, â, î, ș, ț).

REGULI, în ordinea importanței:

1. Nu inventa nicio cifră. Folosești numai cifrele primite. Nu estima, nu extrapola, nu compara cu „media din sector" — nu ai datele altor asociații. Dacă o concluzie ar avea nevoie de o cifră pe care n-o ai (de unde vin donatorii, ce a adus o postare, vârsta lor), scrii limpede că lipsește și ce ar trebui măsurat ca s-o afli.

2. Dacă baza are prea puține date pentru o concluzie, spune asta în loc să construiești una. Zece donatori nu sunt un tipar. E mai util să scrii „încă nu se poate spune" decât să dai o recomandare pe nisip.

3. Fiecare observație se sprijină pe o cifră din text, citată. Fără „se pare că", fără „probabil", fără procente calculate de tine care nu sunt în date.

4. Recomandările sunt lucruri pe care le poate face un singur om într-o săptămână, cu ce are: un e-mail, un telefon, o postare, o schimbare pe site. Nu „construiți o strategie de retenție", ci ce anume de făcut, cui, când.

5. Fără limbaj de prezentare și fără laude. Scrii ce e în neregulă la fel de direct ca ce merge.

Structura răspunsului, exact așa, cu titluri scrise cu ## :

## Ce spun cifrele
Trei-cinci observații, fiecare cu cifra ei. Începi cu cea mai importantă.

## Unde se pierd bani
Ce arată cifrele că se scurge: oameni care nu se întorc, firme blocate, bani lăsați pe masă. Dacă nu se vede nicio scurgere, scrie asta.

## De făcut în următoarele patru săptămâni
Trei-cinci acțiuni, numerotate, fiecare cu: ce anume, pentru cine (ce grup de donatori sau firme), și de ce — cu cifra care o justifică.

## Ce nu putem ști încă
Ce ar fi trebuit măsurat și nu e. Scurt.

Nu adăuga alte secțiuni. Nu adăuga introducere sau încheiere.`;

/** Întoarce analiza, sau `null` dacă nu merge. Panoul spune atunci ce s-a întâmplat. */
export async function cereAnaliza(cifre: string): Promise<string | null> {
  const cheie = process.env.ANTHROPIC_API_KEY;
  if (!cheie) return null;

  try {
    const raspuns = await fetch(`${API}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": cheie,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: PLAFON_RASPUNS,
        system: INSTRUCTIUNI,
        messages: [{ role: "user", content: cifre }],
      }),
    });
    if (!raspuns.ok) return null;

    const corp = (await raspuns.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (corp.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
