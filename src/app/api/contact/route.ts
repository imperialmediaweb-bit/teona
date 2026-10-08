import { NextResponse } from "next/server";

/**
 * Formularul de contact (10.4) și cel de voluntariat (11.4).
 *
 * Caietul cere ca toate cererile să ajungă la contact@teona-ariana.ro, cu
 * eticheta potrivită, și ca expeditorul să primească un email automat de
 * primire. Pentru asta e nevoie de un serviciu de trimitere a emailului,
 * configurat pe gazdă — nu există încă unul ales.
 *
 * Până atunci ruta validează cererea și răspunde cinstit că trimiterea nu e
 * conectată, trimițând omul spre email și telefon. Nu afișăm „Am primit
 * formularul tău” pentru un mesaj care n-a plecat nicăieri și nu stocăm date
 * personale într-un loc din care n-am ști să le scoatem.
 *
 * Când se alege serviciul, se schimbă doar fișierul ăsta.
 */

const EMAIL_VALID = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Corp = {
  fel?: "contact" | "voluntariat";
  nume?: string;
  email?: string;
  acord?: boolean;
};

export async function POST(cerere: Request) {
  let corp: Corp;
  try {
    corp = (await cerere.json()) as Corp;
  } catch {
    return NextResponse.json({ mesaj: "Cerere invalidă." }, { status: 400 });
  }

  if (typeof corp.nume !== "string" || corp.nume.trim().length < 2) {
    return NextResponse.json(
      { mesaj: "Scrie-ți numele, ca să știm cui să răspundem." },
      { status: 400 },
    );
  }

  if (typeof corp.email !== "string" || !EMAIL_VALID.test(corp.email)) {
    return NextResponse.json(
      { mesaj: "Introdu o adresă de e-mail validă." },
      { status: 400 },
    );
  }

  if (corp.acord !== true) {
    return NextResponse.json(
      { mesaj: "Bifează acordul pentru a continua." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      mesaj:
        "Trimiterea formularului nu este încă activă pe site-ul nou — se conectează înainte de lansare. Până atunci scrie-ne direct:",
    },
    { status: 503 },
  );
}
