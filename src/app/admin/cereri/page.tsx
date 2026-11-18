import FormularConfirmat from "@/componente/admin/FormularConfirmat";
import { domeniuPublic, domeniul } from "@/lib/spam";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  areParolaConfigurata,
  arePermisiune,
  esteAutentificat,
  sesiuneProaspata,
} from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import {
  FELURI_CERERE,
  STADII_CERERE,
  type FelCerere,
  type StadiuCerere,
  cereri,
  esteFelCerere,
  esteStadiuCerere,
} from "@/lib/crm";
import Cadru from "@/componente/admin/Cadru";
import { CARD, CardCifra, CifreSus, Eticheta, File, StareGoala } from "@/componente/admin/ui";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock, FileText, HeartHandshake, Inbox, Mail, MessageSquare, Phone, ShieldBan, Users } from "lucide-react";
import TextCuAdrese from "@/componente/admin/TextCuAdrese";
import Descarca from "@/componente/admin/Descarca";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Cereri",
  robots: { index: false, follow: false },
};

type Cautare = { fel?: string; stadiu?: string; gresit?: string; stare?: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function PaginaCereri({
  searchParams,
}: {
  searchParams: Promise<Cautare>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Cereri">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({ searchParams }: { searchParams: Promise<Cautare> }) {
  await connection();
  const { fel, stadiu, gresit, stare } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Cereri" activ="/admin/cereri">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat. Setează{" "}
          <code className="rounded bg-hartie-umbra px-1.5">PAROLA_ADMIN</code>{" "}
          în Railway.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/cereri" faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde="/admin/cereri" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/cereri"))) {
    return <FaraDrept titlu="Cereri" activ="/admin/cereri" />;
  }

  // Date personale: după 12 ore de la ultima intrare se cere iar codul sau parola.
  if (!(await sesiuneProaspata())) {
    return (
      <Cadru titlu="Cereri" activ="/admin/cereri">
        <Intrare confirmare gresit={Boolean(gresit)} unde="/admin/cereri" />
      </Cadru>
    );
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Cereri" activ="/admin/cereri">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const felAles: FelCerere | undefined = esteFelCerere(fel) ? fel : undefined;
  // „nerezolvate”: aceeași regulă ca în „De făcut acum” (tot ce nu e rezolvat).
  const nerezolvate = stadiu === "nerezolvate";
  const stadiuAles: StadiuCerere | "nerezolvate" | undefined = esteStadiuCerere(stadiu)
    ? stadiu
    : nerezolvate
      ? "nerezolvate"
      : undefined;
  const lista = await cereri(felAles, stadiuAles);
  // Cifrele de sus numără toate cererile, oricare ar fi filtrul ales.
  const toate = await cereri(undefined, undefined, 1000);
  const cate = (st: string) => toate.filter((c) => c.stadiu === st).length;
  const cuFel = (fl: string | undefined, st: string | undefined) => {
    const q = new URLSearchParams();
    if (fl) q.set("fel", fl);
    if (st) q.set("stadiu", st);
    return `/admin/cereri${q.size ? `?${q}` : ""}`;
  };

  return (
    <Cadru
      titlu="Cereri"
      descriere="Mesajele venite de pe site: contact, voluntariat și 3,5%."
      activ="/admin/cereri"
      actiuni={<Descarca ce="cereri" />}
    >
      {(stare === "blocat" || stare === "sters") && (
        <p role="status" className="mb-5 rounded-2xl bg-emerald-50 px-5 py-4 font-semibold text-emerald-900">
          {stare === "blocat"
            ? "Șters și blocat. Mesajele noi de la adresa asta nu mai ajung aici. Lista blocaților e la Setări."
            : "Șters."}
        </p>
      )}

      <CifreSus>
        <CardCifra eticheta="Noi" valoare={String(cate("nou"))} context="așteaptă un răspuns" sectiune="oameni" I={Inbox} href={cuFel(felAles, "nou")} activ={stadiuAles === "nou"} />
        <CardCifra eticheta="În lucru" valoare={String(cate("in_lucru"))} context="ai început să le rezolvi" sectiune="oameni" I={Clock} href={cuFel(felAles, "in_lucru")} activ={stadiuAles === "in_lucru"} />
        <CardCifra eticheta="Rezolvate" valoare={String(cate("rezolvat"))} sectiune="oameni" I={CheckCircle2} href={cuFel(felAles, "rezolvat")} activ={stadiuAles === "rezolvat"} />
        <CardCifra eticheta="Toate" valoare={String(toate.length)} sectiune="oameni" I={Users} href={cuFel(felAles, undefined)} activ={!stadiuAles} />
      </CifreSus>

      <File
        file={[
          { eticheta: "Toate", href: cuFel(undefined, stadiuAles), numar: toate.length, activ: !felAles },
          ...FELURI_CERERE.map((f) => ({
            eticheta: f.eticheta,
            href: cuFel(f.id, stadiuAles),
            numar: toate.filter((c) => c.fel === f.id).length,
            activ: felAles === f.id,
          })),
        ]}
      />

      {lista.length === 0 ? (
        <div className="mt-4">
          <StareGoala I={Inbox} text="Nicio cerere aici. Cererile apar singure când cineva completează un formular pe site: 3,5%, voluntariat sau contact." />
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {lista.map((c) => {
            const fel = FEL[c.fel] ?? FEL.contact;
            const ton = c.stadiu === "rezolvat" ? "bani" : c.stadiu === "in_lucru" ? "asteptam" : "deFacut";
            return (
              <li key={c.id} data-cerere={c.fel} className={`${CARD} relative overflow-hidden py-4 pr-4 pl-5 sm:py-5 sm:pr-5 sm:pl-6`}>
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${fel.bara}`} />
                <div className="flex items-start gap-3 sm:gap-4">
                  <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full ${fel.semn}`}>
                    <fel.I className="size-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate font-titlu text-[16px] font-bold text-cerneala">{c.nume}</span>
                      <Eticheta ton={ton}>{STADII_CERERE.find((x) => x.id === c.stadiu)?.eticheta ?? c.stadiu}</Eticheta>
                    </p>
                    <p className="text-[13px] text-cerneala-slab">
                      {FELURI_CERERE.find((f) => f.id === c.fel)?.eticheta ?? c.fel} · {CAND.format(new Date(c.creatLa))}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-hartie-calda px-3 text-[13px] font-semibold text-cerneala-moale hover:text-caramiziu-700">
                          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{c.email}</span>
                        </a>
                      )}
                      {c.telefon && (
                        <a href={`tel:${c.telefon.replace(/\s/g, "")}`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-hartie-calda px-3 text-[13px] font-semibold text-cerneala-moale hover:text-caramiziu-700">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {c.telefon}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {Object.keys(c.detalii).length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 rounded-xl bg-[#faf8f5] p-3.5 text-mic sm:ml-15 sm:grid-cols-[auto_1fr]">
                    {Object.entries(c.detalii).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="font-semibold text-cerneala-slab">{k}</dt>
                        <dd className="min-w-0 whitespace-pre-wrap text-cerneala-moale [overflow-wrap:anywhere]">
                          <TextCuAdrese>{String(v)}</TextCuAdrese>
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hartie-umbra/70 pt-3 sm:ml-15">
                  <form action="/api/admin/cereri" method="post" className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={c.id} />
                    {felAles && <input type="hidden" name="fel" value={felAles} />}
                    <select name="stadiu" defaultValue={c.stadiu} aria-label="Stadiul" className="h-9 rounded-full border border-hartie-umbra bg-hartie px-3 text-[13px]">
                      {STADII_CERERE.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.eticheta}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="h-9 rounded-full bg-cerneala px-4 font-titlu text-[13px] font-bold text-hartie hover:bg-cerneala/85">
                      Salvează
                    </button>
                  </form>
                  {c.email && (
                    <FormularConfirmat
                      action="/api/admin/cereri"
                      method="post"
                      data-spam
                      className="flex flex-wrap items-center gap-2"
                      intrebare={`Ștergi mesajul și blochezi ${c.email}? Mesajele noi de la ea nu vor mai ajunge aici.`}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="actiune" value="spam" />
                      {!domeniuPublic(domeniul(c.email)) && (
                        <label className="inline-flex items-center gap-1.5 text-[12.5px] text-cerneala-slab">
                          <input type="checkbox" name="domeniu" value="1" />
                          tot domeniul @{domeniul(c.email)}
                        </label>
                      )}
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-caramiziu-200 px-3.5 font-titlu text-[13px] font-bold text-caramiziu-800 hover:bg-caramiziu-50"
                      >
                        <ShieldBan className="size-4" aria-hidden="true" />
                        Spam: șterge și blochează
                      </button>
                    </FormularConfirmat>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Cadru>
  );
}

/** Culoarea și iconița fiecărui fel de cerere. */
const FEL: Record<string, { I: LucideIcon; bara: string; semn: string }> = {
  redirectionare: { I: FileText, bara: "bg-emerald-400", semn: "bg-emerald-50 text-emerald-700" },
  voluntariat: { I: HeartHandshake, bara: "bg-sky-400", semn: "bg-sky-50 text-sky-700" },
  contact: { I: MessageSquare, bara: "bg-orange-400", semn: "bg-orange-50 text-orange-700" },
};
