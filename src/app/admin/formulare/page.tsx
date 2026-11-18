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
import { areR2 } from "@/lib/r2";
import { STADII_CERERE, cereri } from "@/lib/crm";
import Cadru from "@/componente/admin/Cadru";
import CampFisier from "@/componente/admin/CampFisier";
import { Sertar } from "@/componente/admin/ui-client";
import { CARD, CARD_ACTIV, CardCifra, CifreSus, Eticheta, StareGoala } from "@/componente/admin/ui";
import { CalendarCheck, CalendarClock, Download, ExternalLink, FileText, ListChecks, Mail, MessageCircle, Upload } from "lucide-react";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";

export const metadata: Metadata = {
  title: "Formulare 230",
  robots: { index: false, follow: false },
};

/**
 * Formularele 230 primite de pe site, și fișierul gol de descărcat.
 *
 * **Aici nu e niciun CNP.** Site-ul nu primește poza formularului: omul o
 * trimite pe WhatsApp sau pe e-mail, direct la asociație. Lista asta are doar
 * cine a completat, cum se ia legătura cu el și pe câți ani a bifat.
 *
 * Rostul ei e timpul: se știe din ziua aceea cine redirecționează, cine a
 * bifat pe doi ani — și deci nu mai trebuie căutat la anul — și pe cine mai
 * trebuie sunat după plic. Hârtia semnată tot trebuie să ajungă la asociație;
 * fără ea, ANAF nu înregistrează nimic.
 */

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const camp =
  "h-10 rounded-xl border border-hartie-umbra bg-hartie px-3 text-mic text-cerneala";

export default function PaginaFormulare({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Formulare 230">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; gresit?: string }>;
}) {
  await connection();
  const { gata, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Formulare 230" activ="/admin/formulare">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Panoul nu e configurat.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Intră în panou" activ="/admin/formulare" faraMeniu>
        <Intrare gresit={Boolean(gresit)} bazaCazuta={gresit === "baza"} unde="/admin/formulare" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/formulare"))) {
    return <FaraDrept titlu="Formulare 230" activ="/admin/formulare" />;
  }

  // Date personale: după 12 ore de la ultima intrare se cere iar codul sau parola.
  if (!(await sesiuneProaspata())) {
    return (
      <Cadru titlu="Formulare 230" activ="/admin/formulare">
        <Intrare confirmare gresit={Boolean(gresit)} unde="/admin/formulare" />
      </Cadru>
    );
  }

  /*
    Lista vine din CRM, nu dintr-un tabel al ei.

    `cereri` are deja categoria „Redirecționare 3,5%", iar formularul de pași
    de pe aceeași pagină scrie tot acolo. Un al doilea tabel ar fi însemnat
    aceiași oameni în două liste, cu două exporturi și două feluri de a-i
    marca rezolvați.
  */
  const formulare = areBazaDeDate()
    ? await cereri("redirectionare", undefined, 500)
    : [];
  const deVerificat = formulare.filter((f) => f.stadiu === "nou").length;

  const peDoiAniTot = formulare.filter((f) => f.detalii["Pe câți ani"] === "2 ani").length;

  return (
    <Cadru
      titlu="Formulare 230"
      descriere="Formularele 230 trimise de pe site și fișierul pe care îl descarcă oamenii."
      activ="/admin/formulare"
      actiuni={
        <>
          <a
            href="/formular-230"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-cerneala/15 bg-hartie px-5 font-titlu text-[14px] font-bold whitespace-nowrap text-cerneala transition-colors hover:border-caramiziu-500"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Vezi pagina de pe site
          </a>
          {/* Formularele venite pe WhatsApp sau la telefon se trec din sertar. */}
          <Sertar eticheta="Adaugă formular" titlu="Adaugă un formular primit pe WhatsApp sau la telefon">
            <form action="/api/admin/cereri" method="post" className="grid gap-4">
              <input type="hidden" name="actiune" value="adauga" />
              <input type="hidden" name="fel" value="redirectionare" />
              <input type="hidden" name="inapoi" value="/admin/formulare" />
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">Numele</span>
                <input name="nume" required className={camp} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-mic font-semibold text-cerneala">Telefon</span>
                  <input name="telefon" inputMode="tel" className={camp} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-mic font-semibold text-cerneala">E-mail</span>
                  <input name="email" type="email" className={camp} />
                </label>
              </div>
              <p className="-mt-2 text-nota text-cerneala-slab">
                Măcar unul dintre ele. De pe WhatsApp ai doar numărul, și e suficient.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-mic font-semibold text-cerneala">Pe câți ani a bifat</span>
                  <select name="ani" defaultValue="" className={camp}>
                    <option value="">Nu știu</option>
                    <option value="1">Un an</option>
                    <option value="2">Doi ani</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-mic font-semibold text-cerneala">A venit prin</span>
                  <select name="deUnde" defaultValue="WhatsApp" className={camp}>
                    <option>WhatsApp</option>
                    <option>E-mail</option>
                    <option>Telefon</option>
                    <option>Hârtie, la Casa Teona</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">Observații</span>
                <input name="observatii" maxLength={300} placeholder="a zis că trimite hârtia săptămâna viitoare" className={camp} />
              </label>
              <div>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-full bg-caramiziu-700 px-5 font-titlu text-[14px] font-bold text-hartie transition-colors hover:bg-caramiziu-800"
                >
                  Adaugă în listă
                </button>
              </div>
            </form>
          </Sertar>
        </>
      }
    >
      {gata && (
        <p role="status" className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 font-semibold text-emerald-900">
          {gata === "urcat" && "Fișierul a fost încărcat. Se descarcă de la teona-ariana.ro/formular-230."}
          {gata === "mutat" && "Gata, stadiul e schimbat."}
          {gata === "sters" && "Șters, cu fișier cu tot."}
          {gata === "nesters" && "N-am putut șterge fișierul, așa că n-am șters nici rândul. Mai încearcă o dată."}
        </p>
      )}

      <CifreSus>
        <CardCifra eticheta="Formulare primite" valoare={String(formulare.length)} sectiune="bani" I={FileText} />
        <CardCifra eticheta="De verificat" valoare={String(deVerificat)} context="cu stadiul „Nou”" sectiune="bani" I={ListChecks} />
        <CardCifra eticheta="Pe doi ani" valoare={String(peDoiAniTot)} context="nu trebuie căutați la anul" sectiune="bani" I={CalendarCheck} />
        <CardCifra eticheta="Termen" valoare="25 mai" context="pentru depunerea la ANAF" sectiune="bani" I={CalendarClock} />
      </CifreSus>

      {/* Fișierul gol, pe care îl descarcă oamenii. */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="hidden size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 sm:grid">
            <Download className="size-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-titlu text-[18px] font-bold text-cerneala">Fișierul de descărcat</h2>
            <p className="mt-1 text-mic text-cerneala-moale">
              PDF-ul Formularului 230, cu datele asociației deja completate. Se descarcă de la{" "}
              <strong className="font-semibold text-cerneala">teona-ariana.ro/formular-230</strong>. Adresa rămâne aceeași și după ce
              înlocuiești fișierul.
            </p>
            {areR2() ? (
              <form
                action="/api/admin/formulare"
                method="post"
                encType="multipart/form-data"
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <input type="hidden" name="actiune" value="urca-gol" />
                <CampFisier name="fisier" accept="application/pdf" required indemn="Alege PDF-ul sau trage-l aici" nota="Numai PDF" />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-caramiziu-700 px-6 font-titlu text-[14px] font-bold text-hartie shadow-sm transition-colors hover:bg-caramiziu-800"
                >
                  <Upload className="size-4" aria-hidden="true" />
                  Încarcă fișierul
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-mic text-amber-900">
                Încărcarea fișierelor nu e pornită încă (lipsesc cheile R2 din Railway). Cere-i dezvoltatorului.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ce au trimis oamenii. */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-titlu text-[18px] font-bold text-cerneala">Formulare primite</h2>
          <p className="text-nota text-cerneala-slab">Fără formularul semnat, trimis prin poștă, ANAF nu înregistrează redirecționarea.</p>
        </div>

        {formulare.length === 0 ? (
          <div className="mt-4">
            <StareGoala
              I={FileText}
              text="Niciun formular primit încă. Apar aici când cineva anunță pe site că l-a completat, sau când adaugi unul primit pe WhatsApp."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-2.5">
            {formulare.map((f) => {
              const peDoiAni = f.detalii["Pe câți ani"] === "2 ani";
              const peWhatsApp = f.telefon ? `https://wa.me/${f.telefon.replace(/\D/g, "").replace(/^0/, "40")}` : null;
              const ton = f.stadiu === "rezolvat" ? "bani" : f.stadiu === "in_lucru" ? "asteptam" : "deFacut";
              return (
                <li key={f.id} data-formular className={`${CARD_ACTIV} relative overflow-hidden py-4 pr-4 pl-5`}>
                  <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${f.stadiu === "rezolvat" ? "bg-emerald-400" : f.stadiu === "in_lucru" ? "bg-sky-400" : "bg-amber-400"}`} />
                  <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 font-titlu text-[14px] font-bold text-emerald-700">
                      {initiale(f.nume)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-titlu text-[15px] font-bold text-cerneala">{f.nume}</span>
                        <Eticheta ton={ton}>{STADII_CERERE.find((s) => s.id === f.stadiu)?.eticheta ?? f.stadiu}</Eticheta>
                        {peDoiAni && <Eticheta ton="bani">2 ani</Eticheta>}
                        {f.detalii["A venit prin"] && <Eticheta ton="gri">{f.detalii["A venit prin"]}</Eticheta>}
                      </p>
                      <p className="truncate text-[13px] text-cerneala-moale">
                        {[f.email, f.telefon].filter(Boolean).join(" · ") || "fără date de contact"} · {CAND.format(new Date(f.creatLa))}
                      </p>
                      {f.detalii.Observații && <p className="mt-0.5 truncate text-[12.5px] text-cerneala-slab">{f.detalii.Observații}</p>}
                    </div>
                    <div className="flex basis-full flex-wrap items-center gap-2 border-t border-hartie-umbra/60 pt-2.5 sm:basis-auto sm:shrink-0 sm:border-0 sm:pt-0">
                      {peWhatsApp && (
                        <a
                          href={peWhatsApp}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 font-titlu text-[13px] font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          <MessageCircle className="size-4" aria-hidden="true" />
                          WhatsApp
                        </a>
                      )}
                      {f.email && (
                        <a
                          href={`mailto:${f.email}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-hartie-umbra px-3.5 font-titlu text-[13px] font-bold text-cerneala-moale hover:text-cerneala"
                        >
                          <Mail className="size-4" aria-hidden="true" />
                          E-mail
                        </a>
                      )}
                      <form action="/api/admin/cereri" method="post" className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="inapoi" value="/admin/formulare" />
                        <select name="stadiu" defaultValue={f.stadiu} aria-label="Stadiul" className="h-9 rounded-full border border-hartie-umbra bg-hartie px-3 text-[13px]">
                          {STADII_CERERE.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.eticheta}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="h-9 rounded-full bg-cerneala px-3.5 font-titlu text-[13px] font-bold text-hartie hover:bg-cerneala/85">
                          Salvează
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Cadru>
  );
}

function initiale(t: string): string {
  const c = t.split(/\s+/).filter(Boolean);
  return ((c[0]?.[0] ?? "") + (c[1]?.[0] ?? "")).toUpperCase() || "?";
}
