import { articole, echipa, media, pagini, pozaLocala, proiecte } from "@/lib/continut";

/**
 * Pagină de inventar, provizorie.
 *
 * Nu e designul site-ului — e dovada că tot conținutul preluat din WordPress
 * se citește corect și că pozele se găsesc la calea locală. Se înlocuiește
 * cu prima pagină adevărată, după caietul de sarcini din
 * `continut/caiet-de-sarcini.txt`.
 */
export default function Inventar() {
  const p = pagini();
  const pr = proiecte();
  const e = echipa();
  const a = articole();
  const m = media();

  const randuri = [
    { ce: "Pagini publicate", n: p.length },
    { ce: "Proiecte", n: pr.length },
    { ce: "Membri în echipă", n: e.length },
    { ce: "Articole de blog", n: a.length },
    { ce: "Fișiere media", n: m.length },
    { ce: "Poze repartizate pe proiecte", n: pr.reduce((s, x) => s + x.poze.length, 0) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Asociația Teona Ariana Suceava
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Conținut preluat din site-ul WordPress. Designul urmează.
      </p>

      <table className="mt-10 w-full text-left text-sm">
        <tbody>
          {randuri.map((r) => (
            <tr key={r.ce} className="border-b border-zinc-200 dark:border-zinc-800">
              <th scope="row" className="py-2 font-normal text-zinc-600 dark:text-zinc-400">
                {r.ce}
              </th>
              <td className="py-2 text-right font-mono tabular-nums">{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-12 text-xl font-semibold">Proiecte</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {pr.slice(0, 10).map((x) => {
          const poza = pozaLocala(x.pozaPrincipala ?? x.poze[0]);
          return (
            <li key={x.id} className="flex items-center gap-3">
              {poza ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poza}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="h-10 w-10 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800" />
              )}
              <span className="truncate">{x.titlu}</span>
              <span className="ml-auto shrink-0 font-mono text-xs text-zinc-500">
                {x.poze.length} poze
              </span>
            </li>
          );
        })}
      </ul>
      {pr.length > 10 && (
        <p className="mt-3 text-sm text-zinc-500">și încă {pr.length - 10}…</p>
      )}
    </main>
  );
}
