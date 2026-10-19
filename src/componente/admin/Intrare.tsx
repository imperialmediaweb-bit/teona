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
export default function Intrare({
  gresit,
  unde = "/admin",
}: {
  gresit?: boolean;
  unde?: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="font-titlu text-mic font-bold tracking-wider text-caramiziu-700 uppercase">
        Nu ești autentificat
      </p>
      <h2 className="mt-2 text-h3 text-cerneala">Intră în panou</h2>

      <div className="mt-6 grid gap-3 colt-mic-a border-t-4 border-miere-400 bg-hartie-calda p-5">
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

        {gresit && (
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
