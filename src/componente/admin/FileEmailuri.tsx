import Link from "next/link";

/**
 * „E-mailuri” e o singură intrare în meniu, cu două file pe aceeași pagină:
 * ce trimite site-ul singur și șabloanele de campanie (noiembrie 2026).
 * Adresele rămân cele vechi.
 */
export default function FileEmailuri({ aici }: { aici: "trimise" | "sabloane" }) {
  const file = [
    { id: "trimise", eticheta: "Mesajele trimise", href: "/admin/emailuri" },
    { id: "sabloane", eticheta: "Șabloane", href: "/admin/sabloane" },
  ] as const;
  return (
    <nav aria-label="E-mailuri" className="mb-6 inline-flex gap-1 rounded-full border border-hartie-umbra bg-hartie p-1">
      {file.map((f) => (
        <Link
          key={f.id}
          href={f.href}
          prefetch={false}
          aria-current={aici === f.id ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 font-titlu text-mic font-bold whitespace-nowrap transition-colors duration-150 ${
            aici === f.id ? "bg-cerneala text-hartie" : "text-cerneala-moale hover:bg-hartie-calda hover:text-cerneala"
          }`}
        >
          {f.eticheta}
        </Link>
      ))}
    </nav>
  );
}
