import { NextResponse } from "next/server";

/**
 * Abonarea la newsletter.
 *
 * Decizia e încă deschisă: caietul de sarcini (12.4) spune că asociația nu are
 * încă o platformă de newsletter și că se alege împreună înainte de lansare, cu
 * servere în Uniunea Europeană, dezabonare dintr-un click și export de date.
 *
 * Până atunci ruta răspunde cinstit că abonarea nu e activă. Nu stocăm adrese
 * într-un loc din care n-am ști să le scoatem, și nu arătăm „Mulțumim!” pentru
 * o abonare care nu s-a întâmplat.
 *
 * Când platforma e aleasă, se schimbă doar fișierul ăsta.
 */
export async function POST(cerere: Request) {
  let corp: unknown;
  try {
    corp = await cerere.json();
  } catch {
    return NextResponse.json(
      { mesaj: "Cerere invalidă." },
      { status: 400 },
    );
  }

  const { email, acord } = (corp ?? {}) as { email?: string; acord?: boolean };

  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { mesaj: "Introdu o adresă de e-mail validă." },
      { status: 400 },
    );
  }

  if (acord !== true) {
    return NextResponse.json(
      { mesaj: "Bifează acordul pentru a continua." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      mesaj:
        "Abonarea la buletinul informativ nu este încă activă — alegem platforma înainte de lansare. Până atunci ne poți scrie direct:",
    },
    { status: 503 },
  );
}
