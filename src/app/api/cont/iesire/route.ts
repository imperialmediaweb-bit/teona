import { NextResponse } from "next/server";
import { inchideSesiunea } from "@/lib/sesiune";

/** Ieșirea din cont. Șterge cookie-ul și trimite omul pe prima pagină. */
export async function POST(cerere: Request) {
  await inchideSesiunea();
  return NextResponse.redirect(new URL("/", cerere.url), { status: 303 });
}
