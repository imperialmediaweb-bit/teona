import { inchideSesiunea } from "@/lib/sesiune";
import { trimiteLa } from "@/lib/api";

/** Ieșirea din cont. Șterge cookie-ul și trimite omul pe prima pagină. */
export async function POST(cerere: Request) {
  await inchideSesiunea();
  return trimiteLa("/");
}
