import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { areParolaConfigurata, esteAutentificat } from "@/lib/admin";
import { areCampanii, grupuri } from "@/lib/email/mailerlite";
import { EMAIL } from "@/date/asociatie";
import Cadru from "@/componente/admin/Cadru";
import Intrare from "@/componente/admin/Intrare";

export const metadata: Metadata = {
  title: "Trimite un e-mail",
  robots: { index: false, follow: false },
};

export default function PaginaEmail({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; eroare?: string; gresit?: string }>;
}) {
  return (
    <Suspense fallback={<Cadru titlu="Trimite un e-mail">Se încarcă…</Cadru>}>
      <Continut searchParams={searchParams} />
    </Suspense>
  );
}

async function Continut({
  searchParams,
}: {
  searchParams: Promise<{ gata?: string; eroare?: string; gresit?: string }>;
}) {
  await connection();
  const { gata, eroare, gresit } = await searchParams;

  if (!areParolaConfigurata()) {
    return (
      <Cadru titlu="Trimite un e-mail" activ="/admin/email">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Zona asta nu e configurată. Setează variabila{" "}
          <code className="rounded bg-hartie-umbra px-1.5 py-0.5">
            PAROLA_ADMIN
          </code>{" "}
          în Railway, cu cel puțin 12 caractere, și reîncarcă pagina.
        </p>
      </Cadru>
    );
  }

  if (!(await esteAutentificat())) {
    return (
      <Cadru titlu="Trimite un e-mail" activ="/admin/email">
        <Intrare gresit={Boolean(gresit)} />
      </Cadru>
    );
  }

  if (!areCampanii()) {
    return (
      <Cadru titlu="Trimite un e-mail" activ="/admin/email">
        <p className="max-w-2xl text-amplu text-cerneala-moale">
          Lipsește{" "}
          <code className="rounded bg-hartie-umbra px-1.5">
            MAILERLITE_API_KEY
          </code>
          . Pune-o în Railway și reîncarcă pagina.
        </p>
      </Cadru>
    );
  }

  const liste = await grupuri();
  const camp =
    "w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-2.5 font-titlu";

  return (
    <Cadru titlu="Trimite un e-mail" activ="/admin/email">
      {gata && (
        <p
          role="status"
          className="mb-8 rounded-card border border-turcoaz-200 bg-turcoaz-50 p-5 text-turcoaz-900"
        >
          <strong className="font-titlu font-bold">
            Ciorna e în MailerLite.
          </strong>{" "}
          Intră în contul MailerLite, deschide campania, trimite-ți o probă pe
          adresa ta, uită-te cum arată pe telefon, și abia apoi apasă trimite.
          Identificator: <code>{gata}</code>
        </p>
      )}
      {eroare && (
        <p
          role="alert"
          className="mb-8 rounded-card border border-caramiziu-200 bg-caramiziu-50 p-5 font-titlu font-semibold text-caramiziu-800"
        >
          {eroare}
        </p>
      )}

      <form
        action="/api/admin/email"
        method="post"
        className="grid max-w-3xl gap-6 rounded-card border border-hartie-umbra bg-hartie p-6 sm:p-8"
      >
        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Subiectul — ce se vede în inbox
          </span>
          <input name="subiect" maxLength={255} required className={camp} />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Expeditor
            </span>
            <input
              name="expeditor"
              type="email"
              required
              defaultValue={EMAIL.contact}
              className={camp}
            />
            <span className="mt-1 block text-nota text-cerneala-slab">
              Trebuie să fie o adresă deja verificată în MailerLite.
            </span>
          </label>
          <label>
            <span className="mb-1 block font-titlu text-mic font-bold">
              Numele expeditorului
            </span>
            <input
              name="nume_expeditor"
              defaultValue="Asociația Teona Ariana Suceava"
              className={camp}
            />
          </label>
        </div>

        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Cui îi trimitem
          </span>
          <select name="grup" className={camp}>
            <option value="">Toți abonații</option>
            {liste.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nume}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Titlul din mesaj
          </span>
          <input name="titlu" maxLength={200} required className={camp} />
        </label>

        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Textul
          </span>
          <textarea name="text" rows={10} required className={camp} />
          <span className="mt-1 block text-nota text-cerneala-slab">
            Un rând gol între paragrafe. Textul se trimite ca text — nu scrie
            HTML, se afișează ca atare.
          </span>
        </label>

        <label>
          <span className="mb-1 block font-titlu text-mic font-bold">
            Poza (adresă)
          </span>
          <input
            name="poza"
            type="url"
            placeholder="https://…"
            className={camp}
          />
          <span className="mt-1 block text-nota text-cerneala-slab">
            Opțional. Trebuie să fie o adresă publică — o poză de pe site sau
            din Cloudinary. Un fișier de pe calculator nu se vede în e-mail.
          </span>
        </label>

        <fieldset className="border-0 p-0">
          <legend className="mb-2 font-titlu text-mic font-bold">
            Butoane la final
          </legend>
          <div className="grid gap-2">
            {[
              { nume: "suma_20", eticheta: "Donez 20 lei" },
              { nume: "suma_50", eticheta: "Donez 50 lei" },
              { nume: "suma_100", eticheta: "Donez 100 lei" },
              { nume: "buton_doneaza", eticheta: "Donează cât vrei tu" },
              {
                nume: "buton_redirectionare",
                eticheta: "Redirecționează 3,5% din impozit",
              },
            ].map((b) => (
              <label key={b.nume} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  name={b.nume}
                  value="da"
                  className="size-4 accent-caramiziu-500"
                />
                <span>{b.eticheta}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-nota text-cerneala-slab">
            Adresele butoanelor se construiesc singure din rutele site-ului.
            Datele asociației, adresa și linkul de dezabonare intră automat în
            subsolul mesajului.
          </p>
        </fieldset>

        <div className="border-t border-hartie-umbra pt-6">
          <button
            type="submit"
            className="w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu text-amplu font-bold text-hartie sm:w-auto"
          >
            Creează ciorna în MailerLite
          </button>
          <p className="mt-3 text-mic text-cerneala-moale">
            Butonul <strong>nu trimite</strong> nimic. Face o ciornă pe care o
            deschizi în MailerLite, îți trimiți o probă și apeși tu trimite. Un
            e-mail plecat spre toată lista nu se mai poate opri.
          </p>
        </div>
      </form>
    </Cadru>
  );
}
