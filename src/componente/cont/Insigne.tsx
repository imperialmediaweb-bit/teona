import type { ContulMeu } from "@/lib/plati/donatori";

/**
 * Insignele donatorului, în contul lui.
 *
 * Numai din ce știm sigur, din donațiile lui: câte a făcut, de câte luni e
 * alături, dacă dă lunar, cât a dăruit. **Nu „ai ajutat 10 copii”**: nu știm
 * câți copii a ajutat o donație anume, iar o cifră inventată pusă în contul
 * cuiva ar fi exact lucrul pe care CLAUDE.md îl interzice („nu inventa
 * cifre”). Insigna următoare se vede estompată, cu cât mai e până la ea.
 */
type Insigna = { titlu: string; text: string; are: boolean; mai?: string };

/** „1 leu”, „5 lei”, „20 de lei”, „101 lei”: regula românească pentru „de”. */
function scrieLei(n: number): string {
  if (n === 1) return "1 leu";
  const r = n % 100;
  return r >= 1 && r <= 19 ? `${n} lei` : `${n} de lei`;
}

function scrieDonatii(n: number): string {
  if (n === 1) return "o donație";
  const r = n % 100;
  return r >= 1 && r <= 19 ? `${n} donații` : `${n} de donații`;
}

export default function Insigne({
  cont,
  lunaraActiva,
}: {
  cont: ContulMeu;
  /** O donație lunară pornită acum (de la Stripe), nu una din trecut. */
  lunaraActiva: boolean;
}) {
  /*
    Gesturile omului, nu plățile: o donație lunară reînnoită de trei ori e
    un singur gest, nu trei. Altfel, după trei luni automate, ar primi
    „Te-ai întors să ajuți” fără să fi făcut nimic de la început.
  */
  const unice = cont.donatii.filter((d) => d.frecventa !== "lunar").length;
  const n = unice + (cont.areLunara ? 1 : 0);
  const areLei = cont.totaluri.some((t) => t.moneda === "RON");
  const lei = (cont.totaluri.find((t) => t.moneda === "RON")?.bani ?? 0) / 100;
  const luni = cont.luniDeAtunci;

  const toate: Insigna[] = [
    { titlu: "Prima donație", text: "Ai făcut primul pas.", are: n >= 1 },
    {
      titlu: "3 donații",
      text: "Te-ai întors să ajuți.",
      are: n >= 3,
      mai: n < 3 ? scrieDonatii(3 - n) : undefined,
    },
    {
      titlu: "10 donații",
      text: "Ești unul dintre oamenii pe care ne sprijinim.",
      are: n >= 10,
      mai: n >= 3 && n < 10 ? scrieDonatii(10 - n) : undefined,
    },
    {
      titlu: "Susținător lunar",
      text: "Ajuți în fiecare lună, fără să-ți amintească nimeni.",
      are: lunaraActiva,
      mai: lunaraActiva ? undefined : "o donație lunară",
    },
    {
      titlu: "Alături de un an",
      text: "Un an de când ne ești aproape.",
      are: luni >= 12,
      mai: luni < 12 ? (12 - luni === 1 ? "o lună" : `${12 - luni} luni`) : undefined,
    },
    {
      titlu: "500 de lei dăruiți",
      text: "Pentru tabere și pentru Casa Teona.",
      are: lei >= 500,
      // Cine a dăruit numai în euro nu primește la nesfârșit „mai ai … lei”.
      mai: areLei && lei < 500 ? scrieLei(Math.ceil(500 - lei)) : undefined,
    },
    {
      titlu: "1.000 de lei dăruiți",
      text: "Mulțumim pentru încredere.",
      are: lei >= 1000,
      mai: lei >= 500 && lei < 1000 ? scrieLei(Math.ceil(1000 - lei)) : undefined,
    },
  ];
  const castigate = toate.filter((i) => i.are);
  // Următoarea: prima necâștigată care are un „mai” (deci are sens acum).
  const urmatoarea = toate.find((i) => !i.are && i.mai);

  return (
    <section className="mt-8 colt-b border border-hartie-umbra bg-hartie p-7 sm:p-8">
      <h3 className="font-titlu text-h4 font-bold text-cerneala">Insignele tale</h3>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {castigate.map((i) => (
          <li
            key={i.titlu}
            className="flex items-start gap-3 rounded-2xl bg-miere-50 p-4 ring-1 ring-miere-200"
          >
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-miere-400 to-caramiziu-600 font-titlu text-mic font-extrabold text-hartie"
            >
              ★
            </span>
            <span>
              <span className="block font-titlu font-bold text-cerneala">{i.titlu}</span>
              <span className="block text-nota text-cerneala-moale">{i.text}</span>
            </span>
          </li>
        ))}
        {urmatoarea && (
          <li className="flex items-start gap-3 rounded-2xl border border-dashed border-hartie-umbra p-4 opacity-70">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-hartie-umbra font-titlu text-mic font-extrabold text-cerneala-slab"
            >
              ☆
            </span>
            <span>
              <span className="block font-titlu font-bold text-cerneala">{urmatoarea.titlu}</span>
              <span className="block text-nota text-cerneala-moale">Mai ai {urmatoarea.mai}.</span>
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
