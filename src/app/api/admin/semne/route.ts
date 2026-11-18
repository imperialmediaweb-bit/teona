import { NextResponse } from "next/server";
import { esteAutentificat } from "@/lib/admin";
import { sesiuneExpirata } from "@/lib/api";
import { semneleMeniului } from "@/componente/admin/Cadru";

/**
 * Bulinele meniului, cerute din nou la fiecare schimbare de pagină: meniul
 * stă pe loc (în aranjament), deci fără asta ar rămâne cu cifrele de la
 * prima deschidere. Aceleași cifre ca „De făcut acum”.
 */
export async function GET() {
  if (!(await esteAutentificat())) return sesiuneExpirata();
  return NextResponse.json(await semneleMeniului(), { headers: { "Cache-Control": "no-store" } });
}
