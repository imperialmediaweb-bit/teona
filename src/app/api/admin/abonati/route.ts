import { email, limitaDeRata, nuTrece, raspuns, text, trimiteLa } from "@/lib/api";
import { arePermisiune, numeleConectat } from "@/lib/admin";
import { areBazaDeDate } from "@/lib/baza";
import { areBuletin, dejaAbonati, laBuletin, stareaInMailerLite } from "@/lib/buletin";
import { trimiteBunVenit } from "@/lib/email/buletin";

/**
 * Adresele adăugate de mână în lista de buletin, din panou.
 *
 * Una sau mai multe, despărțite prin virgulă, punct și virgulă, spațiu sau
 * rând nou. Toate intră în lista aleasă (persoane fizice sau firme): dintr-o
 * adresă nu se poate ști sigur care e, deci alege omul, pentru tot grupul.
 *
 * **Acordul nu e opțional.** Bifa „am acordul fiecăruia” și nota „de unde”
 * se cer pe server, nu doar în pagină, iar nota se păstrează lângă fiecare
 * adresă, cu numele celui care a adăugat-o. Dacă cineva întreabă vreodată de
 * ce a primit buletinul, răspunsul e acolo.
 */

const MAXIM = 200;

export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-abonati",
    maxim: 20,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await arePermisiune("/admin/abonati/incarca"))) return raspuns("Nu ai acces.", 403);
  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);
  if (!areBuletin()) return nuTrece("MailerLite nu e legat (MAILERLITE_API_KEY), deci adresele n-ar avea unde să ajungă.");

  const formular = await cerere.formData().catch(() => null);
  if (!formular) return nuTrece("Cerere invalidă.");

  const lista = formular.get("lista") === "firme" ? "firme" : formular.get("lista") === "persoane" ? "persoane" : null;
  if (!lista) return nuTrece("Alege lista: persoane fizice sau firme.");
  if (formular.get("acord") !== "da") {
    return nuTrece("Bifează că ai acordul fiecărui om de pe listă să primească buletinul.");
  }
  const acordNota = text(formular.get("acord_nota"), 300);
  if (!acordNota) return nuTrece("Scrie de unde aveți acordul lor (de exemplu: lista semnată la tabăra din iulie).");

  const brut = String(formular.get("adrese") ?? "");
  const bucati = [...new Set(brut.split(/[\s,;]+/).map((x) => x.trim().replace(/^<|>$/g, "")).filter(Boolean))];
  if (!bucati.length) return nuTrece("Scrie cel puțin o adresă de e-mail.");
  if (bucati.length > MAXIM) return nuTrece(`Cel mult ${MAXIM} de adrese o dată. Împarte lista în bucăți.`);

  const bune: string[] = [];
  const gresite: string[] = [];
  for (const b of bucati) {
    const e = email(b);
    if (e) bune.push(e.toLowerCase());
    else gresite.push(b);
  }

  const deja = await dejaAbonati(bune);
  const deAdaugat = bune.filter((e) => !deja.has(e));
  const bunVenit = formular.get("bun_venit") === "da";
  const adaugatDe = await numeleConectat();

  let adaugati = 0;
  const ratate: string[] = [];
  const dezabonati: string[] = [];
  for (const e of deAdaugat) {
    // Cine s-a dezabonat nu se pune înapoi de mână, oricât de veche e lista.
    const stare = await stareaInMailerLite(e).catch(() => "necunoscut");
    if (stare === "necunoscut") {
      ratate.push(e);
      continue;
    }
    if (stare && stare !== "active") {
      dezabonati.push(e);
      continue;
    }
    const ok = await laBuletin(e, lista, null, "panou", { adaugatDe, acordNota }).catch(() => false);
    if (!ok) {
      ratate.push(e);
      continue;
    }
    adaugati++;
    if (bunVenit) await trimiteBunVenit({ email: e, nume: null, firma: lista === "firme" }).catch(() => false);
  }

  const q = new URLSearchParams({ adaugati: String(adaugati), lista });
  if (deja.size) q.set("deja", String(deja.size));
  if (gresite.length) q.set("gresite", gresite.join(", ").slice(0, 400));
  if (ratate.length) q.set("ratate", ratate.join(", ").slice(0, 400));
  if (dezabonati.length) q.set("dezabonati", dezabonati.join(", ").slice(0, 400));
  return trimiteLa(`/admin/abonati/incarca?${q}#rezultat`);
}
