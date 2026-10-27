import { after } from "next/server";
import { limitaDeRata, raspuns } from "@/lib/api";
import { egale } from "@/lib/comparatie";
import { areBazaDeDate } from "@/lib/baza";
import { scaneaza } from "@/lib/radar";

/**
 * Capătul prin care radarul e pornit din afară, o dată pe săptămână.
 *
 * **De ce nu se programează singur în aplicație.** Un `setInterval` pus într-un
 * server web pare cea mai simplă cale și e cea mai înșelătoare: Railway
 * repornește containerul la fiecare publicare, poate rula mai multe copii ale
 * aplicației deodată — deci scanarea ar pleca de două ori — și un container
 * adormit nu numără nimic. Ceasul trebuie să stea în afara aplicației.
 *
 * **Cum se programează pe Railway.** Cron-ul lor pornește un serviciu care
 * *se încheie* când a terminat treaba; aplicația web nu se încheie niciodată,
 * deci nu i se poate pune un orar. Se face un al doilea serviciu, mic, care
 * cheamă adresa asta o dată și iese:
 *
 *     curl -fsS -X POST https://<site>/api/radar -H "x-radar: $RADAR_SECRET"
 *
 * Orarul se pune pe serviciul ăla: `0 6 * * 1` = luni la 6:00 **UTC** (cron-ul
 * de pe Railway e în UTC, nu în ora României). Dacă o rulare mai e în curs când
 * vine următoarea, Railway o sare — nu le stivuiește.
 *
 * **Secretul nu e opțional.** Adresa asta cheltuiește bani la fiecare apel:
 * cheamă un model și plătește căutări pe internet. Fără `RADAR_SECRET`
 * configurat, ruta refuză de tot, în loc să rămână deschisă — o scanare o
 * poate porni atunci oricine, de câte ori vrea, iar factura ar crește fără ca
 * nimeni să înțeleagă de ce.
 */
export async function POST(cerere: Request) {
  /*
    Limită strânsă, pe lângă secret. O scanare pe săptămână e ce trebuie; cinci
    pe oră înseamnă că ceva s-a stricat — un orar pus de două ori, un serviciu
    care nu se mai încheie — iar limita oprește factura înainte s-o vadă cineva.
  */
  const prea = limitaDeRata(cerere, {
    cheie: "radar",
    maxim: 3,
    fereastraMs: 60 * 60 * 1000,
  });
  if (prea) return prea;

  const secret = process.env.RADAR_SECRET;
  if (!secret || secret.length < 16) {
    return raspuns("Radarul nu e configurat.", 503);
  }

  const dat = cerere.headers.get("x-radar") ?? "";
  // Comparație în timp constant: altfel durata răspunsului trădează secretul.
  if (!egale(dat, secret)) return raspuns("Nu ai acces.", 403);

  if (!areBazaDeDate()) return raspuns("Nu există bază de date.", 503);

  /*
    Scanarea rulează după răspuns, ca la butonul din panou: ținută în cerere,
    proxy-ul Railway închidea conexiunea înainte să termine (502), și scanarea
    murea fără urmă. Rezultatul, cu eroarea lui dacă are, se scrie în
    `radar_scanari` și se vede în panou; panoul spune și când ultima scanare e
    mai veche de 10 zile, deci un radar mort tot nu trece neobservat.
  */
  after(async () => {
    await scaneaza().catch(() => undefined);
  });
  return raspuns("Scanarea a pornit.", 202);
}

export const GET = () => raspuns("Metodă nepermisă.", 405);
