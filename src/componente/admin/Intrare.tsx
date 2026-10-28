import { cookies } from "next/headers";
import { COOKIE_DISPOZITIV, cititDispozitivul } from "@/lib/admin";
import { areCodRapid } from "@/lib/utilizatori";
import InstaleazaAplicatia from "./InstaleazaAplicatia";

/**
 * Formularul de intrare în panou. Parola merge prin POST, nu prin adresă.
 *
 * Două căi în același formular: contul propriu (e-mail și parolă) sau parola
 * asociației, cu e-mailul lăsat gol. Un formular cu două butoane „Intră" ar
 * fi pus oamenii să aleagă înainte să știe ce aleg; aici e un singur drum, iar
 * câmpul gol spune de la sine ce face.
 *
 * **De ce scrie atât de apăsat că e o intrare.** Formularul ăsta apare în
 * locul oricărei pagini de panou la care ajunge cineva neautentificat — cu
 * meniul din stânga desenat întreg, fiindcă el nu depinde de cine ești. Pe
 * `/admin/utilizatori`, unde pagina adevărată chiar are o casetă „adaugă un
 * om, cu e-mail și parolă", rezultatul arăta leit: două câmpuri, un buton.
 * Un om a scris acolo adresa și parola colegei pe care voia s-o adauge, a
 * apăsat, și a primit „nu se potrivesc" — fiindcă încerca să intre în contul
 * unui om care încă nu există.
 *
 * De aceea: titlu propriu, spus din prima că nu ești înăuntru, și cele două
 * căi scrise una lângă alta, nu o notiță cenușie sub buton. Rândul acela
 * exista și înainte, și n-a ajutat pe nimeni.
 *
 * `unde` spune rutei pe ce pagină se întorcea omul. Ruta nu-l crede pe
 * cuvânt — îl compară cu lista ei de pagini și cu rolul celui care intră —
 * dar așa cine deschide „Contracte" și se autentifică ajunge tot acolo.
 */
export default async function Intrare({
  gresit,
  unde = "/admin",
}: {
  gresit?: boolean;
  unde?: string;
}) {
  /*
    Dispozitivul ținut minte, cu un cod rapid pus: întâi codul. Intrarea cu
    parola rămâne dedesubt, la un clic — pentru alt om pe același aparat sau
    pentru cine și-a uitat codul.
  */
  const borcan = await cookies();
  const idDispozitiv = cititDispozitivul(borcan.get(COOKIE_DISPOZITIV)?.value);
  const cuCod = idDispozitiv
    ? await areCodRapid(idDispozitiv).catch(() => false)
    : false;
  const codBlocat = borcan.get("teona_cod_blocat")?.value === "1";

  if (cuCod) {
    return (
      <div className="max-w-sm">
        <p className="font-titlu text-mic font-bold tracking-wider text-caramiziu-700 uppercase">
          Intră cu codul tău
        </p>
        <form action="/api/admin/intrare" method="post" className="mt-4">
          <input type="hidden" name="unde" value={unde} />
          <input type="hidden" name="fel" value="cod" />
          <label
            htmlFor="cod"
            className="mb-2 block font-titlu text-mic font-bold text-cerneala"
          >
            Codul de intrare rapidă
          </label>
          <input
            id="cod"
            name="cod"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="off"
            autoFocus
            className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 text-center font-titlu text-h3 tracking-[0.5em]"
          />
          {gresit && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
            >
              Codul nu se potrivește. După cinci greșeli la rând se cere
              parola.
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-700"
          >
            Intră
          </button>
        </form>
        <details className="mt-6">
          <summary className="cursor-pointer font-titlu text-mic font-semibold text-caramiziu-700">
            Intră cu e-mail și parolă
          </summary>
          <div className="mt-4">
            <FormularParola unde={unde} gresit={false} codBlocat={false} />
          </div>
        </details>
      </div>
    );
  }

  return (
    <>
      <FormularParola unde={unde} gresit={gresit} codBlocat={codBlocat} />
      {/* Pe pagina de intrare bara n-are meniu; instalarea se poate face și de aici. */}
      <div className="mt-8 max-w-sm">
        <InstaleazaAplicatia luminos />
      </div>
    </>
  );
}

function FormularParola({
  gresit,
  unde,
  codBlocat,
}: {
  gresit?: boolean;
  unde: string;
  codBlocat: boolean;
}) {
  return (
    <div className="max-w-xl">
      {/*
        Titlul paginii îl scrie deja cadrul, deasupra. Aici rămâne numai
        rândul care spune de ce vezi formularul în locul paginii cerute.
      */}
      <p className="font-titlu text-mic font-bold tracking-wider text-caramiziu-700 uppercase">
        Nu ești autentificat
      </p>

      <div className="mt-4 grid gap-3 colt-mic-a border-t-4 border-miere-400 bg-hartie-calda p-5">
        <p className="text-mic text-cerneala-moale">
          <strong className="font-titlu font-bold text-cerneala">
            Cu parola asociației:
          </strong>{" "}
          lasă e-mailul <strong>gol</strong> și scrie numai parola.
        </p>
        <p className="text-mic text-cerneala-moale">
          <strong className="font-titlu font-bold text-cerneala">
            Cu contul tău:
          </strong>{" "}
          scrie e-mailul tău și parola ta.
        </p>
      </div>

      <form action="/api/admin/intrare" method="post" className="mt-6 max-w-sm">
        <input type="hidden" name="unde" value={unde} />

        <label
          htmlFor="email"
          className="mb-2 block font-titlu text-mic font-bold text-cerneala"
        >
          E-mail{" "}
          <span className="font-normal text-cerneala-slab">
            — gol, dacă folosești parola asociației
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
        />

        <label
          htmlFor="parola"
          className="mt-4 mb-2 block font-titlu text-mic font-bold text-cerneala"
        >
          Parola
        </label>
        <input
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-moale border border-hartie-umbra bg-hartie px-4 py-3 font-titlu"
        />

        {codBlocat && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-caramiziu-50 px-4 py-3 text-mic font-semibold text-caramiziu-900"
          >
            Codul a fost greșit de cinci ori, așa că acum se intră cu e-mailul
            și parola. După intrare, codul merge din nou.
          </p>
        )}

        {gresit && !codBlocat && (
          /*
            Un singur mesaj pentru orice nepotrivire. „Adresa nu există" ar
            face din formularul ăsta un instrument de aflat cine lucrează la
            asociație. Dar se poate spune, fără să trădeze pe nimeni, ce
            greșeală face cel mai des omul care ajunge aici.
          */
          <div
            role="alert"
            className="mt-4 colt-mic-b border-t-4 border-caramiziu-600 bg-caramiziu-50 p-4"
          >
            <p className="font-titlu font-bold text-caramiziu-800">
              E-mailul sau parola nu se potrivesc.
            </p>
            <p className="mt-1 text-mic text-caramiziu-900">
              Dacă vrei să intri cu parola asociației, șterge e-mailul și lasă
              câmpul gol.
            </p>
          </div>
        )}

        <label className="mt-4 flex items-start gap-2.5 text-mic text-cerneala-moale">
          <input
            type="checkbox"
            name="tine_minte"
            value="da"
            defaultChecked
            className="mt-0.5 size-4 shrink-0 accent-caramiziu-700"
          />
          <span>
            Ține-mă minte pe acest dispozitiv, 30 de zile. Nu bifa pe un
            calculator pe care îl folosesc și alții.
          </span>
        </label>

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-caramiziu-600 px-6 py-3 font-titlu font-bold text-hartie transition-colors hover:bg-caramiziu-700"
        >
          Intră
        </button>

        <p className="mt-4 text-nota text-cerneala-slab">
          Conturile pe oameni se fac din panou, după ce intri — nu de aici.
          Cinci încercări la 15 minute.
        </p>
      </form>
    </div>
  );
}
