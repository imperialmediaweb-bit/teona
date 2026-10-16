import { esteAutentificat } from "@/lib/admin";
import { limitaDeRata, raspuns } from "@/lib/api";
import { caNume, caPng, caSvg, linkEtichetat } from "@/lib/qr";

/**
 * Codul QR, ca fișier de tipărit.
 *
 * PNG pentru tipografie și Word, SVG pentru cine duce fișierul la un afiș
 * mare: SVG-ul nu se pixelează oricât l-ai mări, iar un cod QR tipărit prost
 * nu se citește deloc.
 */
export async function GET(cerere: Request) {
  const prea = limitaDeRata(cerere, {
    cheie: "admin-qr",
    maxim: 60,
    fereastraMs: 10 * 60 * 1000,
  });
  if (prea) return prea;

  if (!(await esteAutentificat())) return raspuns("Nu ai acces.", 403);

  const adresa = new URL(cerere.url);
  const cale = adresa.searchParams.get("cale") ?? "/doneaza";
  // Numai căi de pe site-ul nostru: „//alt-site.ro" ar trece de un test
  // care se uită doar la prima bară.
  if (!cale.startsWith("/") || cale.startsWith("//")) {
    return raspuns("Cale necunoscută.", 400);
  }

  const loc = adresa.searchParams.get("loc") ?? "";
  const sumaScrisa = Number(adresa.searchParams.get("suma"));
  const suma =
    Number.isFinite(sumaScrisa) && sumaScrisa > 0 && sumaScrisa <= 100_000
      ? Math.round(sumaScrisa)
      : null;

  const link = linkEtichetat({ cale, loc, suma });
  const nume = `Cod-QR-${caNume(loc) || caNume(cale) || "site"}`;

  if (adresa.searchParams.get("fel") === "svg") {
    const svg = await caSvg(link);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nume}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const png = await caPng(link);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${nume}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
