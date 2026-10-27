import sharp from "sharp";

/**
 * Sigla unui sponsor, potrivită singură, oricum ar fi urcată.
 *
 * Asociația a cerut în octombrie 2026: „tu o adaptezi, indiferent cum o urc
 * eu”. Siglele vin cum le trimit firmele: cu margini albe late, uriașe sau
 * minuscule, în SVG, uneori albe pe fundal transparent — iar una albă pe
 * pagina deschisă a site-ului e un dreptunghi gol cu un nume dedesubt
 * (Real Protection Guard a stat așa până a fost pusă de mână pe o plăcuță).
 *
 * Ce face, în ordine:
 * 1. SVG-ul se desenează ca imagine (un SVG urcat ca atare ar putea purta cod);
 * 2. se taie marginile goale, transparente sau de aceeași culoare;
 * 3. se aduce la cel mult 1200 px pe latura lungă;
 * 4. dacă ce se vede din siglă e aproape alb, se pune pe o plăcuță închisă,
 *    cu colțuri rotunde și aer în jur — altfel s-ar pierde pe card.
 *
 * Iese mereu PNG, cu transparența păstrată unde a fost.
 */
export async function potrivesteSigla(
  octeti: Uint8Array,
  tip: string,
): Promise<{ octeti: Uint8Array; tip: "image/png" }> {
  const intrare = Buffer.from(octeti);
  const svg = tip === "image/svg+xml";
  let img = sharp(intrare, svg ? { density: 300 } : {}).rotate();

  // Marginile goale: transparente sau de culoarea colțului.
  img = sharp(await img.png().toBuffer()).trim({ threshold: 12 });
  let buf = await img
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: !svg })
    .png()
    .toBuffer();

  // Cât de luminos e ce se vede (pixelii acoperiți), 0–255.
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let vazuti = 0;
  let lumina = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] > 128) {
      vazuti++;
      lumina += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
  }
  const transparenta = vazuti < (info.width * info.height) * 0.97;
  const deschisa = vazuti > 0 && lumina / vazuti > 215;

  if (transparenta && deschisa) {
    const aer = Math.round(Math.max(info.width, info.height) * 0.12);
    const W = info.width + aer * 2;
    const H = info.height + aer * 2;
    const raza = Math.round(Math.min(W, H) * 0.08);
    const placa = Buffer.from(
      `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${raza}" ry="${raza}" fill="#1f1f1f"/></svg>`,
    );
    buf = await sharp(placa).composite([{ input: buf, left: aer, top: aer }]).png().toBuffer();
  }

  return { octeti: new Uint8Array(buf), tip: "image/png" };
}

/** SVG-ul nu are semnătură binară: se recunoaște după primele caractere. */
export function pareSvg(tip: string, octeti: Uint8Array): boolean {
  if (tip !== "image/svg+xml") return false;
  const inceput = Buffer.from(octeti.slice(0, 512)).toString("utf8").trimStart().toLowerCase();
  return inceput.startsWith("<svg") || (inceput.startsWith("<?xml") && inceput.includes("<svg"));
}
