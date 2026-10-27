import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  analize,
  campanii,
  canale,
  profilulDonatorilor,
  profilulFirmelor,
  type Canalul,
  type ProfilDonatori,
  type ProfilFirme,
} from "@/lib/analiza/cifre";
import { CANALE, numeCanal, type Canal } from "@/lib/atribuire";
import { areReclame, reclame, type Reclame } from "@/lib/reclame/meta";
import { areAnaliza, rezumat } from "@/lib/analiza/intreaba";
import type { Campanie as CampanieCifre } from "@/lib/analiza/cifre";
import Sfatuitor from "@/componente/admin/Sfatuitor";
import { areVizite, vizite } from "@/lib/ga/raport";
import type { Vizite } from "@/lib/ga/raport";
import { cate } from "@/lib/numere-ro";
import { scrieSuma } from "@/lib/suma";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import TextScris from "@/componente/pagina/TextScris";

export const metadata: Metadata = {
  title: "Analiză",
  robots: { index: false, follow: false },
};

/**
 * Profilul donatorilor și al firmelor, plus ce înțelege un model din ele.
 *
 * **De ce există.** Tabloul de bord spune cât a intrat. Nu spune dacă oamenii
 * se întorc, câți dau o singură dată și dispar, unde se îneacă pâlnia
 * firmelor, în ce lună a anului se strâng banii. Sunt întrebările pe care un
 * fundraiser și le pune o dată pe lună și la care, până acum, răspundea
 * numărând de mână în exporturi.
 *
 * **Cifrele sunt pe pagină înaintea analizei, dinadins.** Analiza se face cu
 * un model care poate greși; cifrele, nu. Cine citește o concluzie trebuie să
 * poată verifica din ce a ieșit, pe aceeași pagină, fără să aibă încredere pe
 * cuvânt. De aceea se vede și textul exact trimis modelului.
 *
 * **Fără cheie de API, pagina rămâne utilă.** Profilurile se calculează din
 * baza de date; doar interpretarea lipsește.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const RATAT: Record<string, string> = {
  "fara-cheie":
    "Lipsește ANTHROPIC_API_KEY din Railway. Cifrele de mai jos se văd și fără ea; doar analiza are nevoie de cheie.",
  "putine-date":
    "Încă sunt prea puține donații pentru o analiză care să însemne ceva. Pe zece donații, orice tipar e zgomot.",
  "n-a-mers":
    "Analiza n-a putut fi făcută acum — modelul n-a răspuns. Încearcă din nou în câteva minute.",
};

function lei(bani: number): string {
  return scrieSuma(bani / 100);
}

function procent(parte: number, intreg: number): string {
  if (intreg <= 0) return "—";
  return `${Math.round((parte / intreg) * 100)}%`;
}

function Cifra({
  eticheta,
  valoare,
  nota,
}: {
  eticheta: string;
  valoare: string;
  nota?: string;
}) {
  return (
    <div className="rounded-2xl border border-hartie-umbra bg-hartie p-5">
      <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
        {eticheta}
      </p>
      <p className="mt-2 font-titlu text-h3 leading-none font-extrabold text-cerneala tabular-nums">
        {valoare}
      </p>
      {nota && <p className="mt-1 text-nota text-cerneala-moale">{nota}</p>}
    </div>
  );
}

function Tabel({
  capete,
  randuri,
}: {
  capete: [string, string];
  randuri: Array<[string, string]>;
}) {
  return (
    <table className="w-full text-mic">
      <thead>
        <tr className="border-b border-hartie-umbra">
          <th className="pb-2 text-left font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            {capete[0]}
          </th>
          <th className="pb-2 text-right font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
            {capete[1]}
          </th>
        </tr>
      </thead>
      <tbody>
        {randuri.map(([stanga, dreapta]) => (
          <tr
            key={stanga}
            className="border-b border-hartie-umbra last:border-0"
          >
            <td className="py-2 text-cerneala-moale">{stanga}</td>
            <td className="py-2 text-right font-titlu font-bold text-cerneala">
              {dreapta}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Fisa({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <h3 className="font-titlu text-amplu font-bold text-cerneala">{titlu}</h3>
      {nota && <p className="mt-1 text-nota text-cerneala-slab">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Sectiune({
  titlu,
  nota,
  children,
}: {
  titlu: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hartie-umbra pb-2">
        <h2 className="font-titlu text-amplu font-extrabold text-cerneala">
          {titlu}
        </h2>
        {nota && <p className="text-nota text-cerneala-slab">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

/*
  Filele paginii.

  Pagina avea peste trei mii de pixeli, o secțiune sub alta: vizite, canale,
  reclame, donatori, firme, campanii, analiza scrisă, consultantul. Asociația:
  „lung, neintuitiv”. Acum fiecare lucru e pe fila lui, iar prima filă, „Pe
  scurt”, arată cifrele mari și duce mai departe. Conținutul fiecărei file e
  același de dinainte, cu explicațiile lui.
*/
const FILE = [
  { id: "pe-scurt", nume: "Pe scurt" },
  { id: "donatori", nume: "Donatori" },
  { id: "firme", nume: "Firme" },
  { id: "campanii", nume: "Campanii" },
  { id: "vizite", nume: "Vizite și canale" },
  { id: "reclame", nume: "Reclame" },
  { id: "consultant", nume: "Analiză și consultant" },
] as const;
type Fila = (typeof FILE)[number]["id"];

function Filele({ aici }: { aici: Fila }) {
  return (
    <nav
      aria-label="Secțiunile analizei"
      className="-mx-1 mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-hartie-umbra bg-hartie p-1.5"
    >
      {FILE.map((f) => (
        <Link
          key={f.id}
          href={
            f.id === "pe-scurt"
              ? "/admin/analiza"
              : `/admin/analiza?fila=${f.id}`
          }
          prefetch={false}
          aria-current={f.id === aici ? "page" : undefined}
          className={`shrink-0 rounded-xl px-4 py-2 font-titlu text-mic font-bold whitespace-nowrap transition-colors ${
            f.id === aici
              ? "bg-cerneala text-hartie"
              : "text-cerneala-moale hover:bg-hartie-calda hover:text-cerneala"
          }`}
        >
          {f.nume}
        </Link>
      ))}
    </nav>
  );
}

/** Un card de pe „Pe scurt”: o cifră mare și drumul spre fila ei. */
function Usa({
  fila,
  titlu,
  cifra,
  nota,
  accent,
}: {
  fila: Fila;
  titlu: string;
  cifra: string;
  nota: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={`/admin/analiza?fila=${fila}`}
      prefetch={false}
      className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        accent
          ? "border-caramiziu-700 bg-caramiziu-700 text-hartie"
          : "border-hartie-umbra bg-hartie text-cerneala"
      }`}
    >
      <p
        className={`font-titlu text-nota font-bold tracking-wide uppercase ${
          accent ? "text-hartie/75" : "text-cerneala-slab"
        }`}
      >
        {titlu}
      </p>
      <p className="mt-3 font-titlu text-h2 leading-none font-extrabold tabular-nums">
        {cifra}
      </p>
      <p
        className={`mt-3 text-mic ${accent ? "text-hartie/85" : "text-cerneala-moale"}`}
      >
        {nota}
      </p>
      <p
        className={`mt-4 font-titlu text-mic font-bold ${
          accent ? "text-hartie" : "text-caramiziu-700"
        }`}
      >
        Vezi detaliile{" "}
        <span className="inline-block transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </p>
    </Link>
  );
}

function Donatori({ d }: { d: ProfilDonatori }) {
  const cuDonatii = d.oSinguraData + d.deDouaSauTrei + d.dePatruSauMaiMulte;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Donatori"
          valoare={String(d.donatori)}
          nota={`${d.donatii} donații încasate`}
        />
        <Cifra
          eticheta="Cât dă un om"
          valoare={lei(d.donatieMediana)}
          nota={`La mijloc. Media e ${lei(d.donatieMedie)}, trasă în sus de cele mari.`}
        />
        <Cifra
          eticheta="Se întorc"
          valoare={procent(d.deDouaSauTrei + d.dePatruSauMaiMulte, cuDonatii)}
          nota={`${d.oSinguraData} au dat o singură dată și n-au mai revenit`}
        />
        <Cifra
          eticheta="Vine lunar"
          valoare={lei(d.baniRecurentiPeLuna)}
          nota={`${d.recurentiActivi} donatori cu plată lunară activă`}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa
          titlu="Câte donații face un om"
          nota="Dacă aproape toți sunt în prima linie, munca de atras oameni noi se scurge."
        >
          <Tabel
            capete={["Donații", "Oameni"]}
            randuri={[
              ["O singură dată", String(d.oSinguraData)],
              ["De două-trei ori", String(d.deDouaSauTrei)],
              ["De patru sau mai multe", String(d.dePatruSauMaiMulte)],
            ]}
          />
        </Fisa>

        <Fisa
          titlu="Cât adună fiecare, în total"
          nota="Pe tranșe. Pragul de „donator mare” e 1.000 de lei."
        >
          <Tabel
            capete={["Tranșă", "Donatori"]}
            randuri={d.peTranse.map((t) => [t.eticheta, String(t.donatori)])}
          />
        </Fisa>

        <Fisa
          titlu="Semnele de atenție"
          nota="Fiecare cifră de aici e o listă de oameni pe care îi poți suna."
        >
          <Tabel
            capete={["Ce", "Câți"]}
            randuri={[
              ["S-au oprit (2+ donații, tăcere de 4 luni)", String(d.sAuOprit)],
              [
                "Donatori mari",
                `${d.donatoriMari} · ${procent(d.baniDeLaMari, d.totalBani)} din bani`,
              ],
              ["Au acord de buletin", `${d.cuAcord} din ${d.donatori}`],
              ["Au revenit după primul an", String(d.reveniti)],
              [
                "Până la a doua donație",
                d.zilePanaLaADoua === null
                  ? "încă nimeni"
                  : d.zilePanaLaADoua === 0
                    ? "sub o zi"
                    : cate(d.zilePanaLaADoua, "zi", "zile"),
              ],
            ]}
          />
          <p className="mt-3 text-nota text-cerneala-slab">
            Listele cu nume sunt la{" "}
            <Link
              href="/admin/donatori?filtru=opriti"
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Donatori
            </Link>
            .
          </p>
        </Fisa>
      </div>
    </>
  );
}

/**
 * Ce a adus fiecare campanie.
 *
 * **Vizitele și donațiile nu se adună.** Google numără vizite, baza numără
 * donații, și nu sunt neapărat aceiași oameni. Dar puse una lângă alta arată
 * unde s-a oprit lumea: o campanie cu multe vizite și nicio donație e
 * altceva decât una pe care n-a văzut-o nimeni, iar fără amândouă cifrele nu
 * se poate spune care dintre ele e.
 *
 * **Donațiile fără etichetă nu sunt zero la restul.** O donație fără
 * `campanie_slug` nu înseamnă că n-a venit dintr-o campanie, ci că n-am
 * putut-o lega de una — de aceea apare scris, sub tabel, nu ascuns.
 */
function Campanii({
  c,
  v,
}: {
  c: { lista: CampanieCifre[]; faraEticheta: number; baniFaraEticheta: number };
  v: Vizite | null;
}) {
  const peNume = new Map(
    (v?.campanii ?? []).map((x) => [x.nume.toLowerCase(), x.sesiuni]),
  );
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl text-left text-mic">
          <thead>
            <tr className="border-b border-hartie-umbra">
              <CapTabel>Campania</CapTabel>
              <CapTabel>Strâns</CapTabel>
              <CapTabel>Donații</CapTabel>
              <CapTabel>Donatori</CapTabel>
              <CapTabel>Din țintă</CapTabel>
              <CapTabel>Vizite din link</CapTabel>
            </tr>
          </thead>
          <tbody>
            {c.lista.slice(0, 15).map((x) => {
              const sesiuni =
                peNume.get(x.slug.toLowerCase()) ??
                peNume.get(x.titlu.toLowerCase()) ??
                null;
              return (
                <tr
                  key={x.slug}
                  className="border-b border-hartie-umbra/60 last:border-0"
                >
                  <td className="py-3 pr-4 font-titlu font-bold text-cerneala">
                    {x.titlu}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-cerneala">
                    {scrieSuma(x.bani / 100)}
                  </td>
                  <td className="py-3 pr-4 text-cerneala-moale">{x.donatii}</td>
                  <td className="py-3 pr-4 text-cerneala-moale">
                    {x.donatori}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-cerneala-moale">
                    {x.tintaBani
                      ? `${Math.round((x.bani / x.tintaBani) * 100)}% din ${scrieSuma(x.tintaBani / 100)}`
                      : "—"}
                  </td>
                  <td className="py-3 whitespace-nowrap text-cerneala-moale">
                    {sesiuni === null ? "—" : sesiuni}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-3xl text-nota text-cerneala-slab">
        {c.faraEticheta > 0 && (
          <>
            <strong className="text-cerneala-moale">
              {c.faraEticheta} donații ({scrieSuma(c.baniFaraEticheta / 100)})
            </strong>{" "}
            n-au eticheta vreunei campanii. Nu înseamnă că n-au venit dintr-una
            — înseamnă că n-am putut-o lega.{" "}
          </>
        )}
        {peNume.size === 0 &&
          "Coloana cu vizite e goală: ori Analytics nu e legat, ori linkurile n-au purtat etichete UTM. Fără ele nu se poate spune dacă o campanie n-a adus bani fiindcă n-a văzut-o nimeni sau fiindcă n-a convins."}
      </p>
    </>
  );
}

/**
 * De unde vin oamenii și de unde vin banii, pe aceleași rânduri.
 *
 * **Două surse, niciodată adunate.** Coloana „vizite" o numără Google
 * Analytics; „donații" și „strâns" le numără baza noastră. Un canal cu multe
 * vizite și nicio donație e cu totul altceva decât unul pe care nu l-a văzut
 * nimeni, iar fără amândouă cifrele nu se poate spune care dintre ele e.
 *
 * **Canalul se scrie la donație și nu se ghicește după.** Donațiile dinainte
 * de coloana asta, și cele adăugate de mână din extras, n-au canal — stau în
 * rândul de dedesubt, numărate separat. Aproape de început ele sunt aproape
 * tot; e sincer așa, nu împărțit „proporțional" pe canale, cum ar fi ieșit o
 * cifră frumoasă și inventată.
 */
function DeUndeVin({
  c,
  v,
}: {
  c: { lista: Canalul[]; nelegate: number; baniNelegate: number };
  v: Vizite | null;
}) {
  const vizitePe = new Map<string, number>(
    (v?.canale ?? []).map((x) => [x.canal as string, x.sesiuni]),
  );
  const donatiiPe = new Map(c.lista.map((x) => [x.canal, x]));

  // Rândurile: toate canalele despre care știm ceva, în ordinea din listă.
  const randuri = CANALE.map((def) => ({
    id: def.id as Canal,
    nume: def.nume,
    lamurire: def.lamurire,
    vizite: vizitePe.get(def.id) ?? null,
    date: donatiiPe.get(def.id) ?? null,
  })).filter((r) => r.vizite !== null || r.date !== null);

  const totalVizite = randuri.reduce((s, r) => s + (r.vizite ?? 0), 0);
  const totalBani = randuri.reduce((s, r) => s + (r.date?.bani ?? 0), 0);

  if (randuri.length === 0) {
    return (
      <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
        <p className="max-w-3xl text-amplu text-cerneala-moale">
          Încă nimic de arătat. Canalul se scrie pe fiecare donație începută de
          pe site de acum înainte; vizitele vin de la Google Analytics, când e
          legat.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl text-left text-mic">
          <thead>
            <tr className="border-b border-hartie-umbra">
              <CapTabel>Canal</CapTabel>
              <CapTabel>Vizite</CapTabel>
              <CapTabel>Donații</CapTabel>
              <CapTabel>Donatori</CapTabel>
              <CapTabel>Strâns</CapTabel>
              <CapTabel>Din 100 de vizite, donează</CapTabel>
            </tr>
          </thead>
          <tbody>
            {randuri.map((r) => (
              <tr
                key={r.id}
                className="border-b border-hartie-umbra/60 last:border-0"
              >
                <td className="py-3 pr-4">
                  <span className="font-titlu font-bold text-cerneala">
                    {r.nume}
                  </span>
                  <span className="block max-w-xs text-nota text-cerneala-slab">
                    {r.lamurire}
                  </span>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-cerneala-moale">
                  {r.vizite === null ? "—" : r.vizite}
                </td>
                <td className="py-3 pr-4 text-cerneala-moale">
                  {r.date?.donatii ?? "—"}
                </td>
                <td className="py-3 pr-4 text-cerneala-moale">
                  {r.date?.donatori ?? "—"}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap font-titlu font-bold text-cerneala">
                  {r.date ? lei(r.date.bani) : "—"}
                </td>
                <td className="py-3 whitespace-nowrap text-cerneala-moale">
                  {r.vizite && r.vizite > 0 && r.date
                    ? `${((r.date.donatii / r.vizite) * 100).toFixed(1)}`
                    : "—"}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-hartie-umbra">
              <td className="py-3 pr-4 font-titlu font-bold text-cerneala">
                Total pe canalele știute
              </td>
              <td className="py-3 pr-4 text-cerneala-moale">
                {totalVizite || "—"}
              </td>
              <td className="py-3 pr-4" />
              <td className="py-3 pr-4" />
              <td className="py-3 pr-4 whitespace-nowrap font-titlu font-bold text-cerneala">
                {lei(totalBani)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-3xl text-nota text-cerneala-slab">
        <strong className="text-cerneala-moale">
          Vizitele le numără Google, donațiile baza noastră.
        </strong>{" "}
        Sunt două măsurători diferite, puse alături, nu adunate; când nu se
        potrivesc, baza de date are dreptate.{" "}
        {c.nelegate > 0 && (
          <>
            <strong className="text-cerneala-moale">
              {c.nelegate} donații ({lei(c.baniNelegate)})
            </strong>{" "}
            n-au niciun canal: sunt cele dinainte ca site-ul să-l scrie, cele
            adăugate de mână din extrasul de cont și cele ale oamenilor care au
            scris adresa site-ului de mână. Nu le împărțim pe canale — ar fi o
            cifră inventată.{" "}
          </>
        )}
        {vizitePe.size === 0 &&
          "Coloana cu vizite e goală cât timp Google Analytics nu e legat."}
      </p>
    </>
  );
}

/** Cheltuiala pe reclame Meta, lângă donațiile venite din ele. */
function Reclamele({ r, c }: { r: Reclame; c: Canalul | null }) {
  const donatii = c?.donatii ?? 0;
  const stranse = c?.bani ?? 0;
  return (
    <>
      {!r.cont.activ && (
        <p className="mb-4 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900">
          Contul de reclame nu e activ acum (stare dată de Meta). Cifrele de mai
          jos sunt cele de până acum; reclame noi nu rulează până nu se
          limpezește contul.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Cheltuit pe reclame"
          valoare={lei(r.cheltuitBani)}
          nota={
            r.inainteBani !== null && r.inainteBani > 0
              ? `${r.cheltuitBani >= r.inainteBani ? "+" : ""}${Math.round(
                  ((r.cheltuitBani - r.inainteBani) / r.inainteBani) * 100,
                )}% față de perioada dinainte`
              : `Ultimele ${r.zile} de zile`
          }
        />
        <Cifra
          eticheta="Apăsări pe reclame"
          valoare={String(r.apasari)}
          nota={`${r.afisari} afișări, ${r.ctr.toFixed(1)}% le-au apăsat`}
        />
        <Cifra
          eticheta="Cost pe apăsare"
          valoare={lei(r.cpcBani)}
          nota={`Până la ${r.oameni} oameni deosebiți`}
        />
        <Cifra
          eticheta="Donații din canalul plătit"
          valoare={donatii > 0 ? `${donatii} · ${lei(stranse)}` : "—"}
          nota={
            donatii > 0
              ? `Aproximativ ${lei(Math.round(r.cheltuitBani / donatii))} cheltuiți pe donație`
              : "Încă nicio donație legată de reclame"
          }
        />
      </div>

      {r.campanii.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-mic">
            <thead>
              <tr className="border-b border-hartie-umbra">
                <CapTabel>Reclama</CapTabel>
                <CapTabel>Cheltuit</CapTabel>
                <CapTabel>Afișări</CapTabel>
                <CapTabel>Apăsări</CapTabel>
                <CapTabel>Au apăsat</CapTabel>
                <CapTabel>Cost pe apăsare</CapTabel>
              </tr>
            </thead>
            <tbody>
              {r.campanii.map((x) => (
                <tr
                  key={x.id || x.nume}
                  className="border-b border-hartie-umbra/60 last:border-0"
                >
                  <td className="py-3 pr-4 font-titlu font-bold text-cerneala">
                    {x.nume}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-cerneala">
                    {lei(x.cheltuitBani)}
                  </td>
                  <td className="py-3 pr-4 text-cerneala-moale">{x.afisari}</td>
                  <td className="py-3 pr-4 text-cerneala-moale">{x.apasari}</td>
                  <td className="py-3 pr-4 text-cerneala-moale">
                    {x.ctr.toFixed(1)}%
                  </td>
                  <td className="py-3 whitespace-nowrap text-cerneala-moale">
                    {lei(x.cpcBani)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 max-w-3xl text-nota text-cerneala-slab">
        Contul <strong className="text-cerneala-moale">{r.cont.nume}</strong> (
        {r.cont.id}), în {r.cont.moneda}. Cheltuiala o spune Meta, donațiile le
        numără baza noastră;{" "}
        <strong className="text-cerneala-moale">
          costul pe donație e o apropiere
        </strong>
        , nu o măsurătoare — cine a văzut reclama azi și a făcut transferul
        peste două săptămâni, de pe alt telefon, nu se leagă de ea.
      </p>
    </>
  );
}

/** Ce trebuie pus în Railway ca să se vadă reclamele. */
function FaraReclame() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <p className="max-w-3xl text-amplu text-cerneala-moale">
        Donațiile venite din reclame se văd în tabelul de mai sus și fără asta.
        Ca să apară și <strong>cât s-a cheltuit</strong> pe ele — adică dacă
        banii dați s-au întors — e nevoie în Railway de:
      </p>
      <ul className="mt-3 grid gap-1.5 text-mic text-cerneala-moale">
        {[
          [
            "META_AD_ACCOUNT_ID",
            "numărul contului de reclame, din Meta Ads Manager (începe cu „act_”)",
          ],
          [
            "META_TOKEN",
            "un jeton de acces cu dreptul „ads_read” pe contul acela",
          ],
        ].map(([cheie, ce]) => (
          <li key={cheie}>
            <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
              {cheie}
            </code>{" "}
            — {ce}
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-3xl text-nota text-cerneala-slab">
        Jetonul se face în business.facebook.com, la System Users, și se dă
        numai dreptul de citire: panoul nu pornește, nu oprește și nu schimbă
        nicio reclamă.
      </p>
    </div>
  );
}

function CapTabel({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2 pr-4 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
      {children}
    </th>
  );
}

function Firme({ f }: { f: ProfilFirme }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra eticheta="Firme în evidență" valoare={String(f.firme)} />
        <Cifra
          eticheta="Au virat banii"
          valoare={`${f.pastraDinCerere.incasate}`}
          nota={`${procent(f.pastraDinCerere.incasate, f.firme)} din toate firmele intrate`}
        />
        <Cifra
          eticheta="Sponsorizarea medie"
          valoare={lei(f.sponsorizareMedie)}
          nota={`${lei(f.incasatBani)} în total, după fișe`}
        />
        <Cifra
          eticheta="Durata drumului"
          valoare={
            f.zilePanaLaBani === null
              ? "—"
              : f.zilePanaLaBani === 0
                ? "sub o zi"
                : cate(f.zilePanaLaBani, "zi", "zile")
          }
          nota="De la cerere până la bani în cont, la mijloc"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa titlu="Unde stau firmele" nota="Pâlnia, de la cerere la bani.">
          <Tabel
            capete={["Stadiu", "Firme"]}
            randuri={f.peStadii.map((s) => [s.stadiu, String(s.nr)])}
          />
        </Fisa>

        <Fisa titlu="De unde au venit" nota="Ce cale aduce firme.">
          {f.peCale.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Nicio firmă încă.</p>
          ) : (
            <Tabel
              capete={["Cale", "Firme"]}
              randuri={f.peCale.map((c) => [c.cale, String(c.nr)])}
            />
          )}
        </Fisa>

        <Fisa
          titlu="Blocate"
          nota="Firme fără mișcare de peste două săptămâni."
        >
          <p className="font-titlu text-h4 font-extrabold text-cerneala">
            {f.uitate}
          </p>
          <p className="mt-2 text-mic text-cerneala-moale">
            O firmă căreia i s-a trimis contractul acum trei săptămâni și care
            n-a răspuns nu e „în lucru”, e uitată.
          </p>
          <p className="mt-3 text-nota text-cerneala-slab">
            Lista e la{" "}
            <Link
              href="/admin/firme"
              className="font-semibold text-caramiziu-700 underline underline-offset-2"
            >
              Firme
            </Link>
            .
          </p>
        </Fisa>
      </div>
    </>
  );
}

/**
 * Vizitele de pe site, aduse din Google Analytics.
 *
 * **De ce aici și nu în Google Analytics.** Pentru că nimeni nu intră în
 * Google Analytics: are patruzeci de meniuri și cere învățat, iar panoul se
 * deschide oricum. Aici vin numai cele patru lucruri după care se iau
 * hotărâri — câți oameni, de unde, pe ce pagini, și ce a adus fiecare
 * campanie etichetată.
 *
 * Cifrele astea **nu sunt donații**. Google numără vizite; donațiile le
 * numără baza de date, mai sus pe pagină. Scris pe pagină, nu doar aici: cine
 * le adună din greșeală raportează de două ori aceiași oameni.
 *
 * Învelită în `Suspense`: e o cerere la Google, iar restul paginii n-are de ce
 * s-o aștepte.
 */
async function DinAnalytics() {
  const date = await vizite().catch(() => null);

  if (!date) {
    return (
      <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
        <p className="text-amplu text-cerneala-moale">
          Google Analytics n-a răspuns. Dacă tocmai s-au pus cheile, mai
          încearcă peste câteva minute; dacă nu, verifică dacă contul de
          serviciu e adăugat ca <strong>Vizualizator</strong> pe proprietatea
          GA4.
        </p>
      </div>
    );
  }

  const crestere = (acum: number, inainte: number) =>
    inainte > 0
      ? `${acum >= inainte ? "+" : ""}${Math.round(((acum - inainte) / inainte) * 100)}% față de perioada dinainte`
      : "Nu există perioadă dinainte cu care să comparăm";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          eticheta="Oameni pe site"
          valoare={String(date.utilizatori)}
          nota={crestere(date.utilizatori, date.inainte.utilizatori)}
        />
        <Cifra
          eticheta="Vizite"
          valoare={String(date.sesiuni)}
          nota={crestere(date.sesiuni, date.inainte.sesiuni)}
        />
        <Cifra
          eticheta="Pagini văzute"
          valoare={String(date.vizualizari)}
          nota={`Ultimele ${date.zile} de zile`}
        />
        <Cifra
          eticheta="Pagini pe vizită"
          valoare={
            date.sesiuni > 0
              ? (date.vizualizari / date.sesiuni).toFixed(1)
              : "—"
          }
          nota="Cât de mult se umblă prin site"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Fisa
          titlu="De unde vin"
          nota="Pe vizite. Aici se vede dacă o postare sau un buletin a adus oameni."
        >
          {date.surse.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Încă nicio vizită.</p>
          ) : (
            <Tabel
              capete={["Cale", "Vizite"]}
              randuri={date.surse.map((s) => [s.sursa, String(s.sesiuni)])}
            />
          )}
        </Fisa>

        <Fisa titlu="Cele mai văzute pagini" nota="Pe vizualizări.">
          {date.pagini.length === 0 ? (
            <p className="text-mic text-cerneala-moale">Încă nimic.</p>
          ) : (
            <Tabel
              capete={["Pagina", "Vizualizări"]}
              randuri={date.pagini.map((p) => [p.cale, String(p.vizualizari)])}
            />
          )}
        </Fisa>

        <Fisa
          titlu="Campaniile etichetate"
          nota="Vizite venite din linkuri cu etichetă — buletinele de e-mail, de exemplu."
        >
          {date.campanii.length === 0 ? (
            <p className="text-mic text-cerneala-moale">
              Încă n-a venit nimeni printr-un link etichetat. Linkurile din
              șabloanele de e-mail poartă etichetele, deci apar aici după prima
              campanie trimisă.
            </p>
          ) : (
            <Tabel
              capete={["Campanie", "Vizite"]}
              randuri={date.campanii.map((c) => [c.nume, String(c.sesiuni)])}
            />
          )}
        </Fisa>
      </div>
    </>
  );
}

/** Cât se așteaptă răspunsul de la Google. */
function SeIncarca() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 text-mic text-cerneala-moale">
      Se cer cifrele de la Google…
    </div>
  );
}

/** Ce trebuie făcut ca să meargă, când nu e legat nimic. */
function FaraAnalytics() {
  return (
    <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
      <p className="max-w-3xl text-amplu text-cerneala-moale">
        Site-ul trimite deja date către Google Analytics, dar panoul nu le poate
        citi fără o cheie. E nevoie de un cont de serviciu Google, adăugat ca
        Vizualizator pe proprietatea GA4, iar în Railway de trei variabile:
      </p>
      <ul className="mt-3 grid gap-1.5 text-mic text-cerneala-moale">
        {[
          ["GA_PROPERTY_ID", "numărul proprietății GA4 (nu „G-…”)"],
          ["GA_CLIENT_EMAIL", "adresa contului de serviciu, din fișierul JSON"],
          ["GA_PRIVATE_KEY", "cheia privată din același fișier"],
        ].map(([cheie, ce]) => (
          <li key={cheie}>
            <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
              {cheie}
            </code>{" "}
            — {ce}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PaginaAnaliza({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string; fila?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Analiză">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gresit?: string; ratat?: string; fila?: string }>;
}) {
  await connection();
  const { gresit, ratat, fila: filaCeruta } = await searchParams;
  const fila: Fila = FILE.some((f) => f.id === filaCeruta)
    ? (filaCeruta as Fila)
    : "pe-scurt";

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Analiză" activ="/admin/analiza">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/analiza" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/analiza" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/analiza"))) {
    return <FaraDrept titlu="Analiză" activ="/admin/analiza" />;
  }

  /*
    Fără bază de date rămâne partea de vizite.

    Google Analytics n-are nicio legătură cu baza noastră de date: dacă una
    cade, cealaltă n-are de ce să dispară din panou. Înainte, lipsa bazei
    golea pagina întreagă, inclusiv cifrele care veneau de la Google.
  */
  if (!areBazaDeDate()) {
    return (
      <Cadru
        titlu="Analiză"
        descriere="Vizitele de pe site. Profilurile cer baza de date."
        activ="/admin/analiza"
      >
        <Sectiune
          titlu="Vizitele de pe site"
          nota="Din Google Analytics, ultimele 28 de zile. Sunt vizite, nu donații."
        >
          {areVizite() ? (
            <Suspense fallback={<SeIncarca />}>
              <DinAnalytics />
            </Suspense>
          ) : (
            <FaraAnalytics />
          )}
        </Sectiune>

        <Sectiune titlu="Profilul donatorilor și al firmelor">
          <p className="max-w-2xl text-amplu text-cerneala-moale">
            Lipsește{" "}
            <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>
            . Fără baza de date nu există donatori și firme de profilat.
          </p>
        </Sectiune>
      </Cadru>
    );
  }

  const [donatori, firme, vechi, deVizite, deCampanii, deCanale, deReclame] =
    await Promise.all([
      profilulDonatorilor(),
      profilulFirmelor(),
      analize(6).catch(() => []),
      areVizite() ? vizite().catch(() => null) : Promise.resolve(null),
      campanii().catch(() => null),
      canale().catch(() => null),
      areReclame() ? reclame().catch(() => null) : Promise.resolve(null),
    ]);
  const ultima = vechi[0];
  /*
    Cifrele care s-ar trimite acum.

    Se arată și înainte de prima analiză, nu doar după: cine apasă butonul
    are dreptul să vadă ce pleacă din asociație *înainte* s-o facă, nu după.
    Când există deja o analiză, se arată cifrele salvate odată cu ea — alea
    au plecat atunci, nu cele de azi.
  */
  const acum = rezumat(
    donatori,
    firme,
    deVizite,
    deCampanii,
    deCanale,
    deReclame,
  );

  return (
    <Cadru
      titlu="Analiză"
      descriere="Cine sunt donatorii, unde stau firmele și ce se vede în cifre."
      activ="/admin/analiza"
    >
      {ratat && RATAT[ratat] && (
        <p
          role="alert"
          className="mb-6 colt-mic-a bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
        >
          {RATAT[ratat]}
        </p>
      )}

      {/*
        Scurtătură la consultant, sus.

        Pagina are trei mii de pixeli: profilurile, campaniile, analiza
        scrisă. Consultantul stă la capăt, fiindcă **cifrele rămân înaintea
        interpretării** — cine citește o concluzie trebuie să poată verifica
        pe aceeași pagină din ce a ieșit. Dar cine vine aici cu o întrebare
        nu vine să citească tabele, și n-are de ce să deruleze pe lângă toate
        ca s-o pună. Un rând sus, care sare acolo: ordinea nu se schimbă,
        drumul da.
      */}
      <Filele aici={fila} />

      {fila === "pe-scurt" && areAnaliza() && (
        <a
          href="/admin/analiza?fila=consultant#consultant"
          className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 colt-a border border-caramiziu-200 bg-caramiziu-50 px-5 py-4 transition-colors hover:border-caramiziu-400"
        >
          <span className="font-titlu text-mic font-bold text-caramiziu-900">
            Ai o întrebare? Întreabă consultantul →
          </span>
          <span className="text-nota text-caramiziu-900/75">
            Vede aceleași cifre, știe ce unelte are site-ul. Nu are nume și nici
            adrese.
          </span>
        </a>
      )}

      {fila === "pe-scurt" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Usa
            fila="donatori"
            titlu="Donatori"
            cifra={donatori.donatori.toLocaleString("ro-RO")}
            nota={`${cate(donatori.donatii, "donație", "donații")}, ${lei(donatori.totalBani)} strânși de la începutul evidenței.`}
            accent
          />
          <Usa
            fila="donatori"
            titlu="Vine lunar"
            cifra={lei(donatori.baniRecurentiPeLuna)}
            nota={`De la ${cate(donatori.recurentiActivi, "donator", "donatori")} cu donație lunară pornită.`}
          />
          <Usa
            fila="donatori"
            titlu="S-au oprit"
            cifra={donatori.sAuOprit.toLocaleString("ro-RO")}
            nota="Au dat de cel puțin două ori și nimic în ultimele patru luni. Merită un telefon."
          />
          <Usa
            fila="firme"
            titlu="Firme"
            cifra={firme.firme.toLocaleString("ro-RO")}
            nota={`${lei(firme.incasatBani)} încasați din sponsorizări. ${firme.uitate ? `${cate(firme.uitate, "firmă", "firme")} fără răspuns de mult.` : ""}`}
          />
          <Usa
            fila="campanii"
            titlu="Campanii"
            cifra={(deCampanii?.lista.length ?? 0).toLocaleString("ro-RO")}
            nota="Cât a adus fiecare, din câte donații și câte vizite."
          />
          <Usa
            fila="vizite"
            titlu="Vizite și canale"
            cifra="28 de zile"
            nota="Câți au intrat pe site, de unde au venit și ce i-a adus să doneze."
          />
        </div>
      )}

      {fila === "vizite" && (
        <Sectiune
          titlu="Vizitele de pe site"
          nota="Din Google Analytics, ultimele 28 de zile. Sunt vizite, nu donații."
        >
          {areVizite() ? (
            <Suspense fallback={<SeIncarca />}>
              <DinAnalytics />
            </Suspense>
          ) : (
            <FaraAnalytics />
          )}
        </Sectiune>
      )}

      {fila === "vizite" && deCanale && (
        <Sectiune
          titlu="De unde vin donatorii"
          nota="E-mail, reclame, căutare, cod QR tipărit. Vizitele de la Google, banii din baza noastră."
        >
          <DeUndeVin c={deCanale} v={deVizite} />
        </Sectiune>
      )}

      {fila === "reclame" && (
        <Sectiune
          titlu="Reclamele de pe Facebook și Instagram"
          nota="Cât s-a cheltuit, lângă ce au adus."
        >
          {deReclame ? (
            <Reclamele
              r={deReclame}
              c={
                deCanale?.lista.find((x) => x.canal === "facebook-plata") ??
                null
              }
            />
          ) : areReclame() ? (
            <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
              <p className="text-amplu text-cerneala-moale">
                Meta n-a răspuns. Dacă jetonul tocmai a fost pus, mai încearcă
                peste câteva minute; dacă nu, verifică dacă mai e valabil — cele
                făcute dintr-un cont personal expiră.
              </p>
            </div>
          ) : (
            <FaraReclame />
          )}
        </Sectiune>
      )}

      {fila === "donatori" && (
        <Sectiune
          titlu="Profilul donatorilor"
          nota="Toți donatorii, de la începutul evidenței."
        >
          <Donatori d={donatori} />
        </Sectiune>
      )}

      {fila === "firme" && (
        <Sectiune
          titlu="Profilul firmelor"
          nota="Sponsorizările, de la cap la coadă."
        >
          <Firme f={firme} />
        </Sectiune>
      )}

      {fila === "campanii" &&
        (!deCampanii || deCampanii.lista.length === 0) && (
          <p className="rounded-2xl border border-hartie-umbra bg-hartie p-6 text-amplu text-cerneala-moale">
            Nicio campanie cu donații încă.
          </p>
        )}

      {fila === "campanii" && deCampanii && deCampanii.lista.length > 0 && (
        <Sectiune
          titlu="Ce a adus fiecare campanie"
          nota="Banii din baza noastră, vizitele de la Google. Două surse diferite, puse alături."
        >
          <Campanii c={deCampanii} v={deVizite} />
        </Sectiune>
      )}

      {fila === "consultant" && (
        <Sectiune
          titlu="Ce se vede în cifre"
          nota="Citite de un model, pe cifrele agregate de mai sus."
        >
          {/*
          Ce pleacă din asociație, scris pe pagină.

          Modelul rulează pe serverele altcuiva. Omul care apasă butonul are
          dreptul să știe exact ce se trimite — de aceea textul e aici, de
          deschis, nu o promisiune într-un comentariu din cod pe care n-o
          poate citi nimeni din panou.
        */}
          <div className="colt-a border border-hartie-umbra bg-hartie p-5 sm:p-6">
            <p className="max-w-3xl text-mic text-cerneala-moale">
              Spre model pleacă numai cifrele de mai sus — numărători, sume și
              procente. Niciun nume, niciun e-mail, niciun telefon, nicio
              donație luată separat. I se cere să nu inventeze nicio cifră și să
              spună când datele sunt prea puține pentru o concluzie.
            </p>

            {ultima ? (
              <>
                <p className="mt-5 font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                  Analiza din {CAND.format(new Date(ultima.creatLa))}
                </p>
                <div className="mt-3 max-w-3xl">
                  {/*
                  Modelul numerotează acțiunile; cititorul de text simplu al
                  site-ului știe numai liniuțe. Se schimbă „1." în „- " la
                  afișare, ca lista să nu ajungă un paragraf lipit.
                */}
                  <TextScris
                    continut={ultima.text.replace(/^\s*\d+[.)]\s+/gm, "- ")}
                  />
                </div>
              </>
            ) : (
              <p className="mt-5 text-amplu text-cerneala-moale">
                Nu s-a făcut încă nicio analiză.
              </p>
            )}

            <details className="mt-6" id="ce-se-trimite">
              <summary className="cursor-pointer font-titlu text-mic font-bold text-caramiziu-700">
                {ultima
                  ? "Vezi exact ce s-a trimis"
                  : "Vezi exact ce s-ar trimite"}
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-moale bg-hartie-calda p-4 text-nota whitespace-pre-wrap text-cerneala-moale">
                {ultima ? ultima.cifre : acum}
              </pre>
            </details>

            <form action="/api/admin/analiza" method="post" className="mt-6">
              <button
                type="submit"
                disabled={!areAnaliza()}
                className="rounded-full bg-caramiziu-700 px-6 py-3 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800 disabled:cursor-not-allowed disabled:bg-cerneala-slab"
              >
                {ultima ? "Fă o analiză nouă" : "Fă prima analiză"}
              </button>
              <p className="mt-2 text-nota text-cerneala-slab">
                {areAnaliza()
                  ? "Durează câteva secunde. Cel mult trei pe oră — cifrele asociației nu se schimbă de la un minut la altul."
                  : "Are nevoie de ANTHROPIC_API_KEY în Railway."}
              </p>
            </form>
          </div>

          {vechi.length > 1 && (
            <details className="mt-5">
              <summary className="cursor-pointer font-titlu text-mic font-bold text-caramiziu-700">
                Analizele de dinainte ({vechi.length - 1})
              </summary>
              <div className="mt-4 grid gap-5">
                {vechi.slice(1).map((a) => (
                  <div
                    key={a.id}
                    className="colt-a border border-hartie-umbra bg-hartie p-5"
                  >
                    <p className="font-titlu text-nota font-bold tracking-wide text-cerneala-slab uppercase">
                      {CAND.format(new Date(a.creatLa))}
                    </p>
                    <div className="mt-3 max-w-3xl">
                      <TextScris
                        continut={a.text.replace(/^\s*\d+[.)]\s+/gm, "- ")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/*
          Consultantul, sub analiză.

          Analiza de sus răspunde la „cum stăm". Munca începe la întrebarea
          următoare — „de unde încep cu cei care s-au oprit?", „ce le scriu
          firmelor care n-au răspuns?" —, iar alea nu se pot ghici dinainte,
          deci nu încap într-un raport scris o dată pe lună.

          Vede exact aceleași cifre, agregate: le trimite serverul, nu caseta.
        */}
          {areAnaliza() ? (
            <div className="mt-6 scroll-mt-6" id="consultant">
              <Sfatuitor />
            </div>
          ) : (
            <p className="mt-6 colt-a border border-hartie-umbra bg-hartie-calda px-5 py-4 text-mic text-cerneala-moale">
              Consultantul cu care se poate vorbi are nevoie de aceeași cheie,{" "}
              <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
                ANTHROPIC_API_KEY
              </code>
              .
            </p>
          )}
        </Sectiune>
      )}
    </Cadru>
  );
}
