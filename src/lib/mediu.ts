/**
 * O variabilă din mediu, curățată de spații și rânduri noi.
 *
 * Lipită în Railway cu un spațiu la capăt, `STRIPE_WEBHOOK_SECRET` făcea ca
 * fiecare anunț de plată să fie respins ca „semnătură invalidă”; cu un rând
 * nou, `STRIPE_SECRET_KEY` oprea toate donațiile cu cardul; `PAROLA_ADMIN`
 * cu spațiu închidea panoul. Nimic în jurnal (auditul din 4 noiembrie 2026).
 * `fetch` curăță singur antetele, deci cheile care merg prin HTTP mergeau —
 * tocmai de aceea defectul nu se vedea decât la cele care nu trec prin el.
 */
export function mediu(nume: string): string | undefined {
  const v = process.env[nume]?.trim();
  return v ? v : undefined;
}
