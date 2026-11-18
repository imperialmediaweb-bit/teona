import { cache } from "react";
import Link from "next/link";
import Sigla from "@/componente/Sigla";
import { cineEsteConectat, esteAutentificat, rolulConectat } from "@/lib/admin";
import { NUMELE_ROLULUI, poateVedea } from "@/lib/utilizatori";
import { areBazaDeDate } from "@/lib/baza";
import { deFacutAcum } from "@/lib/statistici";
import MeniuPanou, { type Semne } from "@/componente/admin/MeniuPanou";
import CautareRapida from "@/componente/admin/CautareRapida";
import { ACASA, ACTIUNI_RAPIDE, GRUPURI_MENIU, PAGINI_RAPIDE, SETARI } from "@/componente/admin/meniu-date";

/**
 * Panoul: meniul (în `admin/layout.tsx`, ca să rămână pe loc de la o pagină
 * la alta) și antetul fiecărei pagini (`Cadru`).
 *
 * **De ce nu seamănă cu site-ul.** Aici se văd nume, adrese de e-mail și sume
 * de bani. Bara închisă la culoare (antracit cald) se vede dintr-o privire:
 * ești în panou, nu pe pagina publică.
 */

/**
 * Bulinele din meniu: aceleași cifre ca „De făcut acum” de pe tabloul de bord
 * (`deFacutAcum`), deci bulina și cardul nu se pot contrazice. Numai după
 * intrare: un om din afară n-are de ce să afle câte cereri sunt pe masă.
 */
export const semneleMeniului = cache(async (): Promise<Semne> => {
  if (!areBazaDeDate() || !(await esteAutentificat())) return { pe: {}, total: 0 };
  const lucruri = await deFacutAcum().catch(() => []);
  const pe: Record<string, number> = {};
  for (const l of lucruri) if (l.meniu) pe[l.meniu] = (pe[l.meniu] ?? 0) + l.nr;
  return { pe, total: lucruri.reduce((t, l) => t + l.nr, 0) };
});

function SiglaPanou() {
  return (
    <Link href="/admin" prefetch={false} className="inline-flex rounded-lg transition-opacity hover:opacity-80">
      <Sigla peFundalInchis className="text-[34px]" />
      <span className="sr-only">Acasă</span>
    </Link>
  );
}

/**
 * Meniul, pentru `admin/layout.tsx`. Fără intrare, numai sigla: un meniu
 * desenat pentru cine nu e înăuntru arăta a panou deschis, iar un om a scris
 * odată în formularul de intrare adresa și parola colegei.
 *
 * Din meniu lipsesc paginile pe care rolul nu le vede. Ascunsul nu e
 * protecția (aia e în pagină și în rută), dar un link spre „pagina nu e
 * deschisă pentru tine” e o promisiune pe care panoul n-o ține.
 */
export async function MeniulPanoului() {
  const cine = await cineEsteConectat();
  if (!cine) {
    return (
      <div className="bg-[#272320] px-5 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <SiglaPanou />
      </div>
    );
  }
  const rol = await rolulConectat();
  const vede = (h: string) => !rol || poateVedea(rol, h.split("?")[0]);
  const grupuri = GRUPURI_MENIU.map((g) => ({ ...g, pagini: g.pagini.filter((p) => vede(p.href)) })).filter((g) => g.pagini.length > 0);
  const initiale = cine.nume
    .split(/\s+/)
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <MeniuPanou
      sigla={<SiglaPanou />}
      grupuri={grupuri}
      acasa={ACASA}
      setari={vede(SETARI.href) ? SETARI : null}
      semneInitiale={await semneleMeniului()}
      cont={{ nume: cine.nume, rol: NUMELE_ROLULUI[cine.rol], initiale: initiale || "A", parola: vede("/admin/parola") }}
    />
  );
}

/** Fereastra căutării rapide (Ctrl K), una pe tot panoul, cu paginile și acțiunile rolului. */
export async function CautareaPanoului() {
  if (!(await esteAutentificat())) return null;
  const rol = await rolulConectat();
  const vede = (h: string) => !rol || poateVedea(rol, h.split("?")[0]);
  return (
    <CautareRapida
      pagini={PAGINI_RAPIDE.filter((p) => vede(p.href))}
      actiuni={ACTIUNI_RAPIDE.filter((a) => vede(a.drept)).map((a) => ({ eticheta: a.eticheta, detaliu: a.detaliu, href: a.href, pictograma: a.pictograma }))}
    />
  );
}

/**
 * Antetul și conținutul unei pagini din panou: titlul și o propoziție în
 * stânga, butonul principal (și „Descarcă pentru Excel”) în dreapta, pe
 * aceeași lățime (cel mult 1160 px) ca tot ce e dedesubt.
 *
 * `activ` și `faraMeniu` au rămas pentru paginile care le trimit încă:
 * elementul activ se citește acum din adresă, iar meniul îl hotărăște
 * aranjamentul după intrare.
 */
export default function Cadru({
  titlu,
  descriere,
  actiuni,
  children,
}: {
  titlu: string;
  /** O frază sub titlu: ce e pagina asta și la ce folosește. */
  descriere?: string;
  activ?: string;
  /** Butonul principal (și „Descarcă pentru Excel”), în dreapta titlului. */
  actiuni?: React.ReactNode;
  faraMeniu?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-hartie-umbra/70 bg-hartie">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <h1 className="font-titlu text-[26px] leading-tight font-bold text-cerneala sm:text-[28px]">{titlu}</h1>
            {descriere && <p className="mt-1 max-w-2xl text-[15px] text-cerneala-moale">{descriere}</p>}
          </div>
          {actiuni && <div className="flex flex-wrap items-center gap-2">{actiuni}</div>}
        </div>
      </div>
      {/*
        Zona de conținut are nume propriu, nu doar `#panou-admin`: probele
        aleg „primul rând” din ea, iar meniul e și el o listă.
      */}
      <div id="continut-panou" className="mx-auto max-w-[1160px] px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </div>
    </>
  );
}
