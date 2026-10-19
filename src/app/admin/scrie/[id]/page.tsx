import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areParolaConfigurata, arePermisiune, esteAutentificat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { esteFel, felul, textDupaId, type Text } from "@/lib/texte";
import { adresaPoza, areCloudinary } from "@/lib/poza-urcata";
import { areCheiCloudinary, toateDosarele } from "@/lib/cloudinary-listare";
import { CATEGORII } from "@/date/proiecte-tipuri";

import { areAsistent } from "@/lib/asistent";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";
import FaraDrept from "@/componente/admin/FaraDrept";
import Asistent from "@/componente/admin/Asistent";

export const metadata: Metadata = {
  title: "Scrie",
  robots: { index: false, follow: false },
};

/**
 * Editorul unei noutăți sau al unei campanii.
 *
 * **Un formular obișnuit, nu o aplicație.** Trimite cu `method="post"` către
 * `/api/admin/texte` și se întoarce cu o redirecționare. Fără JavaScript ar
 * funcționa la fel: cineva care scrie o noutate de pe telefon, pe o conexiune
 * proastă, n-are nevoie să aștepte încărcarea unui editor.
 *
 * **Două butoane, nu unul.** „Salvează ciorna” și „Publică”. Un singur buton
 * cu o bifă „publicat” lângă el face ca publicarea să fie un lucru pe care îl
 * uiți bifat — iar greșeala se vede pe site, nu în panou.
 */

const camp =
  "w-full colt-mic-a border border-hartie-umbra bg-hartie px-4 py-2.5 text-cerneala";

export default function PaginaEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fel?: string; gata?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Scrie">Se încarcă…</Cadru>}>
      <Continut params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fel?: string; gata?: string; gresit?: string }>;
}) {
  await connection();
  const { id } = await params;
  const { fel: felCerut, gata, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Scrie" activ="/admin/scrie">
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
      <Cadru titlu="Intră în panou" activ="/admin/scrie" faraMeniu>
        <Intrare gresit={Boolean(gresit)} unde="/admin/scrie" />
      </Cadru>
    );
  }

  if (!(await arePermisiune("/admin/scrie"))) {
    return <FaraDrept titlu="Scrie" activ="/admin/scrie" />;
  }

  if (!areBazaDeDate()) {
    return (
      <Cadru titlu="Scrie" activ="/admin/scrie">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">DATABASE_URL</code>.
        </p>
      </Cadru>
    );
  }

  const nou = id === "nou";
  const text: Text | null = nou ? null : await textDupaId(id);
  if (!nou && !text) notFound();

  const fel = text?.fel ?? (esteFel(felCerut) ? felCerut : "noutate");
  const acesta = felul(fel);

  /*
    Folderele din Cloudinary, pentru alegerea galeriei unui proiect.

    Se citesc doar când se scrie un proiect: la o noutate ar fi două cereri
    la Cloudinary degeaba, la fiecare deschidere a editorului.
  */
  const dosare =
    fel === "proiect" && areCheiCloudinary()
      ? await toateDosarele().catch(() => [])
      : [];

  return (
    <Cadru
      titlu={nou ? acesta.butonNou : text!.titlu}
      descriere={
        nou
          ? "Scrie, salvează ca ciornă, iar când e gata apasă „Publică”."
          : text!.publicat
            ? `Publicat. Se vede la ${acesta.cale}/${text!.slug}`
            : "Ciornă. Nu se vede pe site."
      }
      activ="/admin/scrie"
      actiuni={
        <Link
          href={`/admin/scrie?fel=${fel}`}
          className="font-titlu text-mic font-semibold text-caramiziu-700 hover:underline"
        >
          ← Înapoi la listă
        </Link>
      }
    >
      {gata && (
        <p
          role="status"
          className="mb-7 colt-mic-a border border-turcoaz-200 bg-turcoaz-50 px-5 py-4 text-turcoaz-900"
        >
          {gata === "publicat" && "Publicat. E pe site."}
          {gata === "salvat" && "Salvat ca ciornă."}
        </p>
      )}

      {/*
        Asistentul scrie o primă ciornă în câmpurile de mai jos. Apare doar cu
        `ANTHROPIC_API_KEY` în Railway, ca orice altceva care depinde de un
        serviciu din afară, și nu trimite nimic nicăieri: completează două
        câmpuri, atât. Stătea pe pagina de e-mail, care a dispărut — aici e
        locul lui, pentru că aici se scrie.
      */}
      {nou && areAsistent() && <Asistent />}

      <form
        action="/api/admin/texte"
        method="post"
        encType="multipart/form-data"
        className="grid max-w-3xl gap-6"
      >
        <input type="hidden" name="fel" value={fel} />
        {!nou && <input type="hidden" name="id" value={text!.id} />}

        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">
            Titlul
          </span>
          <input
            name="titlu"
            required
            maxLength={200}
            defaultValue={text?.titlu ?? ""}
            className={camp}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">
            Rezumatul — o frază, cea care apare în listă și pe Facebook
          </span>
          <textarea
            name="rezumat"
            rows={2}
            maxLength={400}
            defaultValue={text?.rezumat ?? ""}
            className={`${camp} resize-y`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="font-titlu text-mic font-bold text-cerneala">
            Textul
          </span>
          <span className="text-mic text-cerneala-moale">
            Un rând gol desparte paragrafele. Un rând care începe cu{" "}
            <code className="rounded bg-hartie-umbra px-1">##</code> e un
            subtitlu, unul care începe cu{" "}
            <code className="rounded bg-hartie-umbra px-1">-</code> e un punct
            de listă. Altceva nu e nevoie: felul în care arată textul îl dă
            site-ul.
          </span>
          <textarea
            name="continut"
            required
            rows={16}
            defaultValue={text?.continut ?? ""}
            className={`${camp} resize-y font-mono text-mic`}
          />
        </label>

        {fel === "proiect" && (
          <fieldset className="grid gap-5 colt-a border border-hartie-umbra bg-hartie p-5">
            <legend className="px-2 font-titlu text-mic font-bold text-cerneala">
              Când a fost și unde-i sunt pozele
            </legend>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Prima zi
                </span>
                <span className="text-mic text-cerneala-moale">
                  După ea se așază proiectul în listă.
                </span>
                <input
                  type="date"
                  name="dataInceput"
                  defaultValue={text?.dataInceput ?? ""}
                  className={camp}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Cum se citește data
                </span>
                <span className="text-mic text-cerneala-moale">
                  Asta se vede pe pagină. O tabără ține cinci zile, nu una.
                </span>
                <input
                  name="dataCitita"
                  placeholder="9 – 13 iunie 2025"
                  defaultValue={text?.dataCitita ?? ""}
                  className={camp}
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                La ce categorie apare
              </span>
              <select
                name="categorie"
                defaultValue={text?.categorie ?? ""}
                className={camp}
              >
                <option value="">După an, automat</option>
                {CATEGORII.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.eticheta}
                  </option>
                ))}
              </select>
            </label>

            {/*
              Galeria: se alege folderul, nu se urcă pozele a doua oară.

              Asociația le urcă oricum în Cloudinary, pe foldere, de pe
              telefon. O listă de ales e un clic; o sută de fotografii urcate
              din nou e o după-amiază.
            */}
            <label className="grid gap-1.5">
              <span className="text-mic font-semibold text-cerneala">
                Folderul cu pozele, din Cloudinary
              </span>
              {dosare.length > 0 ? (
                <>
                  <span className="text-mic text-cerneala-moale">
                    Toate pozele din folderul ales apar în galeria paginii, cele
                    mai noi primele. Dacă lași gol, pozele se caută după dată,
                    din numele folderului.
                  </span>
                  <select
                    name="dosarCloud"
                    defaultValue={text?.dosarCloud ?? ""}
                    className={camp}
                  >
                    <option value="">Fără folder ales — caută după dată</option>
                    {dosare.map((d) => (
                      <option key={d.cale} value={d.cale}>
                        {d.cale}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <input
                  name="dosarCloud"
                  placeholder="2025/TABĂRĂ AUTISM 8-12 SEPTEMBRIE 2025"
                  defaultValue={text?.dosarCloud ?? ""}
                  className={camp}
                />
              )}
            </label>
          </fieldset>
        )}

        {fel === "campanie" && (
          <label className="grid gap-1.5">
            <span className="font-titlu text-mic font-bold text-cerneala">
              Ținta campaniei, în lei (opțional)
            </span>
            <span className="text-mic text-cerneala-moale">
              Apare pe pagină ca „strângem X lei”. Lasă gol dacă nu vrei să
              anunți o sumă — o țintă neatinsă, afișată luni de zile, face mai
              mult rău decât bine.
            </span>
            <input
              name="tinta"
              inputMode="decimal"
              defaultValue={text?.tintaBani ? String(text.tintaBani / 100) : ""}
              className={camp}
            />
          </label>
        )}

        <fieldset className="grid gap-4 colt-a border border-hartie-umbra bg-hartie p-5">
          <legend className="px-2 font-titlu text-mic font-bold text-cerneala">
            Fotografia
          </legend>

          {text?.poza && (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adresaPoza(text.poza.id, 320)}
                alt={text.poza.alt}
                className="h-24 w-32 shrink-0 colt-mic-a object-cover"
              />
              <p className="text-mic text-cerneala-moale">
                Poza de acum. Dacă alegi alta mai jos, o înlocuiește.
              </p>
            </div>
          )}

          {areCloudinary() ? (
            <>
              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Alege o fotografie (JPG, PNG sau WebP)
                </span>
                <input
                  type="file"
                  name="poza"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-mic"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-mic font-semibold text-cerneala">
                  Ce se vede în poză
                </span>
                <span className="text-mic text-cerneala-moale">
                  Obligatoriu dacă pui o poză. E ce aude cineva care nu vede
                  ecranul, și ce citește Google. „Copii și voluntari la masa de
                  prânz, în tabăra de la Vama”, nu „poza 1”.
                </span>
                <input
                  name="poza_alt"
                  maxLength={300}
                  defaultValue={text?.poza?.alt ?? ""}
                  className={camp}
                />
              </label>
            </>
          ) : (
            <p className="text-mic text-cerneala-moale">
              Lipsesc cheile Cloudinary, deci nu se pot urca poze. Textul se
              poate scrie oricum.
            </p>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="actiune"
            value="salveaza"
            className="colt-mic-a border-2 border-cerneala/15 bg-hartie px-5 py-2.5 font-titlu text-mic font-bold text-cerneala transition-colors hover:border-caramiziu-500"
          >
            Salvează ciorna
          </button>
          <button
            type="submit"
            name="actiune"
            value="publica"
            className="colt-mic-a bg-caramiziu-700 px-6 py-2.5 font-titlu text-mic font-bold text-hartie transition-colors hover:bg-caramiziu-800"
          >
            {text?.publicat ? "Publică schimbările" : "Publică"}
          </button>
        </div>
      </form>

      {!nou && (
        <form
          action="/api/admin/texte"
          method="post"
          className="mt-10 max-w-3xl border-t border-hartie-umbra pt-6"
        >
          <input type="hidden" name="id" value={text!.id} />
          <input type="hidden" name="actiune" value="sterge" />
          <button
            type="submit"
            className="font-titlu text-mic font-semibold text-caramiziu-800 underline underline-offset-4 hover:text-caramiziu-900"
          >
            Șterge textul ăsta
          </button>
          <span className="ml-3 text-mic text-cerneala-slab">
            Nu se mai poate recupera.
          </span>
        </form>
      )}
    </Cadru>
  );
}
