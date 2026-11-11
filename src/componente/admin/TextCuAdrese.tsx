/**
 * Un text în care poate fi o adresă de e-mail, scris dintr-o pagină de server.
 *
 * Cloudflare ascunde adresele din HTML și le pune la loc cu un script, ca nod
 * de text **separat**. Dacă adresa stătea lipită de alt text în același nod
 * („2026-11-10 · 50 lei · ana@…”), după scriptul lui pagina are trei noduri
 * acolo unde React a desenat unul și hidratarea cade cu eroarea #418 —
 * prinsă pe 11 noiembrie 2026 la `/admin/donatii`, numai pe site-ul adevărat.
 * Așa că fiecare adresă primește elementul ei.
 */
const ADRESA = /([^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+)/g;

export default function TextCuAdrese({ children }: { children: string }) {
  const bucati = children.split(ADRESA);
  if (bucati.length === 1) return <>{children}</>;
  return (
    <>
      {bucati.map((b, i) => (i % 2 === 1 ? <span key={i}>{b}</span> : b))}
    </>
  );
}
