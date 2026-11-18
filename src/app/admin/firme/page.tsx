import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cate } from "@/lib/numere-ro";
import {
  COLOANE_FIRME,
  coloanaFirmei,
  listaFirmelor,
  marcheazaNelegateCitite,
  mesajeNelegate,
  type RandListaFirme,
} from "@/lib/mesaje-firme";
import Cadru from "@/componente/admin/Cadru";
import Descarca from "@/componente/admin/Descarca";
import MesajFirma from "@/componente/admin/firme/MesajFirma";
import PanouFirme, { type CardFirma } from "@/componente/admin/firme/PanouFirme";
import Pictograma from "@/componente/Pictograma";
import { poarta } from "@/componente/admin/firme/Poarta";

/**
 * Firme / Sponsori: un panou pe coloane — De contactat, Așteaptă răspuns,
 * Au răspuns, Contract semnat — în care fiecare firmă stă singură unde îi e
 * locul, după ultimul mesaj și contract (noiembrie 2026). Clic pe card =
 * pagina firmei, cu discuția și formularul de răspuns.
 */

export const metadata: Metadata = {
  title: "Firme / Sponsori",
  robots: { index: false, follow: false },
};

type Cautare = {
  fila?: string;
  cauta?: string;
  necitite?: string;
  uitate?: string;
  gresit?: string;
  trimise?: string;
  ratate?: string;
  refuza?: string;
  stearsa?: string;
  arhivata?: string;
  deschis?: string;
};

export default function PaginaFirme({ searchParams }: { searchParams: Promise<Cautare> }) {
  return (
    <Suspense fallback={<Cadru titlu="Firme / Sponsori">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

const ZI = 24 * 60 * 60 * 1000;
const DATA = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" });
const ZIUA = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" });
/** Zile calendaristice întregi între două clipe, la ora României. */
function zileIntre(de: Date, pana: Date): number {
  return Math.round((Date.parse(ZIUA.format(pana)) - Date.parse(ZIUA.format(de))) / ZI);
}
/** „azi”, „ieri”, „acum 4 zile”, apoi data. */
function cand(iso: string, acum: Date): string {
  const z = zileIntre(new Date(iso), acum);
  if (z <= 0) return "azi";
  if (z === 1) return "ieri";
  if (z < 7) return `acum ${z} zile`;
  return DATA.format(new Date(iso));
}

/** Inițialele firmei, fără „SRL”, „SA” și altele asemenea. */
function initiale(nume: string): string {
  const cuvinte = nume
    .replace(/\b(S\.?R\.?L\.?|S\.?A\.?|S\.?C\.?|P\.?F\.?A\.?|I\.?I\.?|SRL-D)\b/gi, "")
    .split(/[\s\-.&]+/)
    .filter((x) => /\p{L}|\d/u.test(x));
  return ((cuvinte[0]?.[0] ?? "?") + (cuvinte[1]?.[0] ?? "")).toUpperCase();
}
const FONDURI = [
  "bg-caramiziu-100 text-caramiziu-900",
  "bg-turcoaz-100 text-turcoaz-900",
  "bg-miere-100 text-cerneala",
  "bg-sky-100 text-sky-900",
  "bg-hartie-umbra text-cerneala",
];
function fond(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FONDURI[h % FONDURI.length];
}
const fd = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** De la câte zile fără răspuns se spune pe card că trebuie revenit. */
const REVINO_DUPA_ZILE = 7;

function laCard(f: RandListaFirme, acum: Date): CardFirma {
  const coloana = coloanaFirmei(f);
  const u = f.ultimul;
  const zile = u ? zileIntre(new Date(u.cand), acum) : 0;
  const jos =
    f.trimise > 0
      ? `${cate(f.trimise, "trimis", "trimise")} · ${cate(f.deschise, "deschis", "deschise")}`
      : "";
  return {
    id: f.id,
    denumire: f.denumire,
    persoana: f.persoana,
    initiale: initiale(f.denumire),
    fond: fond(f.id),
    coloana,
    nou: f.necitite > 0,
    linie: u ? { cine: u.directie === "primit" ? "Ei" : "Noi", text: u.inceput || u.subiect, cand: cand(u.cand, acum) } : null,
    jos,
    intarziere: coloana === "asteapta" && zile > REVINO_DUPA_ZILE ? `de ${cate(zile, "zi", "zile")} fără răspuns` : null,
    faraEmailuri: f.faraEmailuri,
    cheie: fd(`${f.denumire} ${f.persoana} ${f.email} ${f.cui.startsWith("fara-cui-") ? "" : f.cui}`),
  };
}

const FILE: Record<string, CardFirma["coloana"]> = {
  contactat: "contactat",
  asteapta: "asteapta",
  raspuns: "raspuns",
  semnat: "semnat",
};

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const q = await searchParams;
  const oprit = await poarta("Firme / Sponsori", "/admin/firme", q.gresit);
  if (oprit) return oprit;
  // Linkurile vechi spre fișa deschisă în listă (`?deschis=<id>`) duc acum la pagina firmei.
  if (/^[0-9a-f-]{36}$/i.test(q.deschis ?? "")) redirect(`/admin/firme/${q.deschis}/mesaje`);

  const necitite = q.necitite === "1";
  const uitate = q.uitate === "1";
  const acum = new Date();
  const [lista, nelegate] = await Promise.all([listaFirmelor({ necitite, uitate }), mesajeNelegate()]);
  if (nelegate.some((m) => !m.citit))
    await marcheazaNelegateCitite(nelegate.filter((m) => !m.citit).map((m) => String(m.id))).catch(() => undefined);
  const carduri = lista.map((f) => laCard(f, acum));
  // Pe telefon se deschide fila cerută din link (bulina din meniu duce la „Au răspuns”), altfel prima care are ceva.
  const fila =
    FILE[q.fila ?? ""] ?? COLOANE_FIRME.find((c) => carduri.some((x) => x.coloana === c.id))?.id ?? "contactat";

  return (
    <Cadru
      titlu="Firme / Sponsori"
      descriere="Fiecare firmă stă singură în coloana ei, după ultimul e-mail. Clic pe ea pentru discuție."
      activ="/admin/firme"
      actiuni={
        <span className="flex flex-wrap items-center gap-2">
          <Descarca ce="firme" />
          <Link
            href="/admin/firme/scrie"
            data-email-nou
            className="inline-flex items-center gap-2 rounded-full bg-caramiziu-700 px-5 py-2.5 font-titlu text-mic font-bold text-hartie shadow-sm hover:bg-caramiziu-800"
          >
            <Pictograma nume="plus" className="size-4" strokeWidth={2.5} />
            E-mail nou
          </Link>
        </span>
      }
    >
      {q.stearsa && <Anunt>Firma a fost ștearsă, cu discuția și atașamentele ei.</Anunt>}
      {q.arhivata && (
        <Anunt ton="neutru">
          Firma are contracte sau donații, deci n-am șters-o: e arhivată. Nu mai apare în liste, dar rămâne în registru și în
          rapoarte.
        </Anunt>
      )}
      {q.trimise !== undefined && (
        <Anunt ton={Number(q.trimise) === 0 ? "rau" : "bun"}>
          {Number(q.trimise) === 1
            ? "A plecat 1 e-mail."
            : Number(q.trimise) === 0
              ? "N-a plecat niciun e-mail."
              : `Au plecat ${cate(Number(q.trimise), "e-mail", "e-mailuri")}, fiecare la firma lui.`}
          {q.ratate && <span className="block font-normal text-caramiziu-900">N-au plecat: {q.ratate}.</span>}
          {q.refuza && <span className="block font-normal">Sărite, fiindcă nu mai vor e-mailuri: {q.refuza}.</span>}
        </Anunt>
      )}
      {(necitite || uitate) && (
        <p className="mb-4 text-mic text-cerneala-moale">
          {necitite && "Numai firmele cu răspunsuri necitite. "}
          {uitate && "Numai firmele fără răspuns de două săptămâni (fără nicio notiță scrisă între timp). "}
          <Link href="/admin/firme" className="font-semibold text-caramiziu-700 underline underline-offset-2">
            Arată toate firmele
          </Link>
        </p>
      )}

      <PanouFirme carduri={carduri} coloane={COLOANE_FIRME} cautaLaInceput={(q.cauta ?? "").slice(0, 100)} filaLaInceput={fila} />

      {nelegate.length > 0 && !necitite && !uitate && (
        <section className="mt-10 grid max-w-4xl gap-4">
          <h2 className="font-titlu text-amplu font-bold text-cerneala">Răspunsuri pe care nu le-am putut lega de o firmă</h2>
          <p className="text-mic text-cerneala-moale">
            Au venit de la o adresă care nu e în nicio fișă de firmă. Dacă e o firmă de-a voastră, puneți adresa asta în fișa ei.
          </p>
          {nelegate.map((m) => (
            <MesajFirma key={m.id} m={m} />
          ))}
        </section>
      )}
    </Cadru>
  );
}

function Anunt({ ton = "bun", children }: { ton?: "bun" | "neutru" | "rau"; children: React.ReactNode }) {
  const c = { bun: "bg-turcoaz-50 text-turcoaz-900", neutru: "bg-hartie-umbra/70 text-cerneala", rau: "bg-caramiziu-50 text-caramiziu-900" }[ton];
  return (
    <p role="status" className={`mb-6 colt-mic-a px-4 py-3 text-mic font-semibold ${c}`}>
      {children}
    </p>
  );
}
