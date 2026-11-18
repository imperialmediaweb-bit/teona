import { NextResponse } from "next/server";
import { formularAdmin, limitaDeRata, raspuns, sesiuneExpirata, text } from "@/lib/api";
import { arePermisiune, cineEsteConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { firma as citesteFirma } from "@/lib/crm";
import { EMAIL } from "@/date/asociatie";
import { areEmail, trimiteEmailCuId } from "@/lib/email/trimite";
import { textSimplu } from "@/lib/text-bogat";
import { campaniileAlese, scrisoarea } from "@/lib/mesaje-firme";

/**
 * „Vezi cum arată” și „Trimite-mi o probă” pentru e-mailul către o firmă.
 * Compune scrisoarea cu aceeași funcție ca trimiterea adevărată (`scrisoarea`),
 * cu numele primei firme alese; fără firmă, cu un nume de exemplu.
 * Proba pleacă la omul care scrie, nu la firmă, și nu se scrie nicăieri.
 */

const UUID = /^[0-9a-f-]{36}$/i;
const EXEMPLU = { denumire: "Firma de probă SRL", persoana: "Maria Popescu" };

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, { cheie: "admin-firme-previzualizare", maxim: 120, fereastraMs: 60 * 60 * 1000 });
  if (prea) return prea;
  if (!(await arePermisiune("/admin/firme"))) return sesiuneExpirata();

  const citit = await formularAdmin(cerere);
  if (citit.raspuns) return citit.raspuns;
  const f = citit.formular;

  const id = String(f.get("firma") ?? "") || String(f.getAll("firme")[0] ?? "");
  const fi = UUID.test(id) && areBazaDeDate() ? await citesteFirma(id).catch(() => null) : null;
  const subiectScris = text(f.get("subiect"), 200) ?? text(f.get("subiect_implicit"), 200) ?? "";
  const continut = String(f.get("continut") ?? "").trim().slice(0, 100_000);

  const cine = await cineEsteConectat();
  const trimisDe = cine?.nume ?? "Asociația";
  const emailCelui = cine?.fel === "cont" ? cine.utilizator.email : null;
  const campanii = areBazaDeDate() ? await campaniileAlese(f.getAll("campanii")) : [];
  const s = scrisoarea({
    // Butoanele din previzualizare nu duc nicăieri: nu se face un link semnat pentru o vizualizare.
    // Fără firmă din listă, dar cu una nouă scrisă pe loc: cu numele ei.
    firma: fi
      ? { denumire: fi.denumire, persoana: fi.persoana }
      : text(f.get("nou_denumire"), 200)
        ? { denumire: text(f.get("nou_denumire"), 200)!, persoana: text(f.get("nou_persoana"), 150) ?? EXEMPLU.persoana }
        : EXEMPLU,
    subiect: subiectScris || "(fără subiect)",
    html: continut || "<p>(textul e încă gol)</p>",
    trimisDe,
    emailCelui,
    campanii,
  });

  if (f.get("fac") !== "proba") {
    return NextResponse.json(
      { html: s.html, deLa: `${s.expeditorNume} <${s.dela}>`, subiect: s.subiect, pentru: fi?.denumire ?? text(f.get("nou_denumire"), 200) ?? null },
      { headers: { "Cache-Control": "no-store, no-transform" } },
    );
  }

  if (!subiectScris) return raspuns("Scrie subiectul.", 400);
  if (textSimplu(continut).join(" ").length < 2) return raspuns("Scrie textul e-mailului.", 400);
  if (!areEmail()) return raspuns("Trimiterea de e-mailuri nu e configurată pe site.", 503);
  const la = emailCelui ?? EMAIL.contact;
  const r = await trimiteEmailCuId({
    catre: la,
    subiect: `[PROBĂ] ${s.subiect}`,
    html: s.html,
    text: s.text,
    expeditorNume: s.expeditorNume,
    expeditorAdresa: s.dela,
    masa: true,
  }).catch(() => ({ ok: false, id: null }));
  if (!r.ok) return raspuns("Proba n-a plecat: serverul de e-mail n-a răspuns. Încearcă peste câteva minute.", 502);
  return NextResponse.json({ trimisLa: la });
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
