import { NextResponse } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { esteAutentificat } from "@/lib/admin";
import { creeazaCiorna } from "@/lib/email/mailerlite";
import { ADRESA_SITE } from "@/app/seo";
import { RUTE } from "@/date/asociatie";

/**
 * Compune o campanie și o lasă ca **ciornă** în MailerLite.
 *
 * Nu trimite. Un e-mail plecat spre toată lista nu se poate opri, corecta sau
 * retrage — îl vede un om în MailerLite, își trimite o probă și apasă el.
 */
export async function POST(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-email",
    maxim: 20,
    fereastraMs: 30 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const f = await cerere.formData().catch(() => null);
  if (!f) return raspuns("Cerere invalidă.", 400);

  const camp = (n: string) => String(f.get(n) ?? "").trim();

  const subiect = camp("subiect");
  const titlu = camp("titlu");
  const expeditor = camp("expeditor");
  if (!subiect || !titlu || !expeditor) {
    return inapoi(cerere, "Completează subiectul, titlul și adresa de expediere.");
  }

  const paragrafe = camp("text")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (paragrafe.length === 0) {
    return inapoi(cerere, "Scrie textul mesajului.");
  }

  const pozaAdresa = camp("poza");
  const butoane: Array<{ eticheta: string; adresa: string }> = [];

  // Butoanele predefinite: sumele duc direct pe pagina de donație, cu suma
  // aleasă. Nu scriem adrese de mână — vin din rutele site-ului.
  for (const suma of ["20", "50", "100"]) {
    if (f.get(`suma_${suma}`) === "da") {
      butoane.push({
        eticheta: `Donez ${suma} lei`,
        adresa: `${ADRESA_SITE}${RUTE.doneaza}?suma=${suma}`,
      });
    }
  }
  if (f.get("buton_doneaza") === "da") {
    butoane.push({
      eticheta: "Donează cât vrei tu",
      adresa: `${ADRESA_SITE}${RUTE.doneaza}`,
    });
  }
  if (f.get("buton_redirectionare") === "da") {
    butoane.push({
      eticheta: "Redirecționează 3,5% din impozit",
      adresa: `${ADRESA_SITE}${RUTE.redirectionare35}`,
    });
  }

  const grup = camp("grup");
  const rezultat = await creeazaCiorna({
    nume: titlu.slice(0, 120),
    subiect,
    expeditor,
    numeExpeditor: camp("nume_expeditor") || "Asociația Teona Ariana Suceava",
    grupuri: grup ? [grup] : [],
    continut: {
      titlu,
      paragrafe,
      poza: pozaAdresa ? { adresa: pozaAdresa, alt: titlu } : null,
      butoane,
    },
  });

  if (!rezultat.ok) return inapoi(cerere, rezultat.mesaj);

  return NextResponse.redirect(
    new URL(`/admin/email?gata=${encodeURIComponent(rezultat.id)}`, cerere.url),
    { status: 303 },
  );
}

function inapoi(cerere: Request, mesaj: string) {
  return NextResponse.redirect(
    new URL(`/admin/email?eroare=${encodeURIComponent(mesaj)}`, cerere.url),
    { status: 303 },
  );
}
