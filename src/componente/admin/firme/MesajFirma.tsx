import { curataHtml } from "@/lib/curata-html";
import type { Mesaj } from "@/lib/mesaje-firme";

const cand = (iso: string) =>
  new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bucharest",
  }).format(new Date(iso));

function marime(o: number) {
  return o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} KB` : `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Ce s-a întâmplat cu un e-mail trimis, în cuvinte. */
function Stare({ m }: { m: Mesaj }) {
  const semne: Array<{ text: string; ton: "bun" | "rau" | "slab"; titlu?: string }> = [];
  if (m.respins) semne.push({ text: `Nu a ajuns: ${m.respins}`, ton: "rau" });
  else if (m.livratLa) semne.push({ text: "Livrat", ton: "slab" });
  else semne.push({ text: "Trimis", ton: "slab" });
  if (m.deschideri > 0)
    semne.push({
      text: `Deschis${m.deschideri > 1 ? ` de ${m.deschideri} ori` : ""}`,
      ton: "bun",
      titlu: m.deschisLa ? `Prima dată: ${cand(m.deschisLa)}` : undefined,
    });
  if (m.clicuri > 0)
    semne.push({
      text: `A apăsat pe link${m.clicuri > 1 ? ` (${m.clicuri})` : ""}`,
      ton: "bun",
      titlu: m.ultimulLink ?? undefined,
    });
  const clasa = {
    bun: "bg-turcoaz-50 text-turcoaz-900",
    rau: "bg-caramiziu-50 text-caramiziu-900",
    slab: "bg-hartie-umbra/60 text-cerneala-moale",
  } as const;
  return (
    <span className="flex flex-wrap gap-1.5" data-stare>
      {semne.map((s) => (
        <span key={s.text} title={s.titlu} className={`rounded-full px-2.5 py-0.5 text-nota font-semibold ${clasa[s.ton]}`}>
          {s.text}
        </span>
      ))}
    </span>
  );
}

export default function MesajFirma({ m }: { m: Mesaj }) {
  const trimis = m.directie === "trimis";
  return (
    <article
      data-mesaj={m.directie}
      className={`grid gap-3 rounded-card border p-4 sm:p-5 ${
        trimis ? "ml-auto w-full max-w-[680px] border-hartie-umbra bg-hartie" : "mr-auto w-full max-w-[680px] border-caramiziu-200 bg-caramiziu-50/40"
      } ${!m.citit ? "ring-2 ring-caramiziu-400" : ""}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 text-mic [overflow-wrap:anywhere]">
          <span className="font-titlu font-bold text-cerneala">{trimis ? (m.trimisDe ?? "Asociația") : m.deLa}</span>
          <span className="text-cerneala-slab"> {trimis ? `→ ${m.catre}` : "a răspuns"}</span>
          {!m.citit && <span className="ml-2 rounded-full bg-caramiziu-700 px-2 py-0.5 text-nota font-bold text-hartie">nou</span>}
        </p>
        <time className="text-nota text-cerneala-slab">{cand(m.creatLa)}</time>
      </header>
      <p className="font-titlu text-mic font-bold text-cerneala [overflow-wrap:anywhere]">{m.subiect}</p>
      <div className="text-bogat text-mic break-words" dangerouslySetInnerHTML={{ __html: curataHtml(m.html) || "" }} />
      {!m.html.trim() && m.text && <p className="whitespace-pre-line text-mic text-cerneala-moale">{m.text}</p>}
      {m.atasamente.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {m.atasamente.map((a) => (
            <li key={a.id}>
              <a
                href={`/api/admin/firme/atasament?id=${a.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-hartie-umbra bg-hartie px-3 py-1 text-nota font-semibold text-cerneala hover:border-caramiziu-400"
              >
                📎 {a.nume} <span className="font-normal text-cerneala-slab">{marime(a.marime)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {trimis && <Stare m={m} />}
    </article>
  );
}
