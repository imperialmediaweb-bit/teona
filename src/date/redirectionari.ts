/**
 * Adresele vechi de pe teona-ariana.ro și unde duc pe site-ul nou.
 *
 * Site-ul vechi e indexat de Google, are linkuri în articole de presă, în
 * postări de Facebook și în mesaje trimise donatorilor. Dacă adresele vechi
 * ajung la pagina 404, se pierde și traficul, și încrederea omului care a dat
 * clic. De aceea fiecare adresă publică veche are aici o destinație.
 *
 * Redirecționările sunt permanente (301): spun motoarelor de căutare că pagina
 * s-a mutat definitiv, deci autoritatea adresei vechi trece la cea nouă. O
 * redirecționare temporară le-ar ține pe amândouă în index.
 *
 * Paginile de magazin și de donații ale pluginurilor vechi (WooCommerce,
 * GiveWP) nu mai există deloc pe site-ul nou — caietul cere la 2.6 să dispară
 * „orice formular vechi de donație care nu mai funcționează”. Ele duc la
 * pagina Donează, singurul loc unde se donează acum.
 */
export const REDIRECTIONARI: ReadonlyArray<{ de_la: string; la: string }> = [
  // Paginile de conținut, redenumite.
  { de_la: "/despre", la: "/despre-noi" },
  { de_la: "/echipa", la: "/despre-noi" },
  { de_la: "/casateona", la: "/casa-teona" },
  { de_la: "/sponsori", la: "/sponsori-si-parteneri" },
  { de_la: "/35-2", la: "/redirectioneaza-3-5" },
  { de_la: "/contact-us", la: "/contact" },
  { de_la: "/campanii", la: "/doneaza" },
  { de_la: "/faqs", la: "/doneaza" },
  { de_la: "/events", la: "/proiecte" },
  { de_la: "/resurse", la: "/despre-noi" },

  // Paginile legale: „cookies” și „gdpr” se unesc în cele trei din caiet.
  { de_la: "/cookies", la: "/politica-de-cookieuri" },
  { de_la: "/gdpr", la: "/politica-de-confidentialitate" },

  // Raportul 2025 — două adrese, aceeași pagină.
  {
    de_la: "/raport-anual-de-activitate-2025-asociatia-teona-ariana-suceava",
    la: "/raport-de-activitate-2025",
  },
  {
    de_la: "/raport-anual-de-activitate-2025-asociatia-teona-ariana-suceava-2",
    la: "/raport-de-activitate-2025",
  },

  // Magazinul și formularele vechi de donație.
  { de_la: "/shop", la: "/doneaza" },
  { de_la: "/cart", la: "/doneaza" },
  { de_la: "/checkout", la: "/doneaza" },
  { de_la: "/my-account", la: "/doneaza" },
  { de_la: "/order-tracking", la: "/doneaza" },
  { de_la: "/donations", la: "/doneaza" },
  { de_la: "/donation-list-1", la: "/doneaza" },
  { de_la: "/donation-infinite-scroll", la: "/doneaza" },
  { de_la: "/donation-carousel", la: "/doneaza" },
  { de_la: "/donation-confirmation", la: "/doneaza" },
  { de_la: "/donation-failed", la: "/doneaza" },
  { de_la: "/donor-dashboard", la: "/doneaza" },
  { de_la: "/donor-dashboard-2", la: "/doneaza" },

  // Articolele de blog. Patru dintre ele descriau exact ce e acum o pagină
  // întreagă, deci duc acolo.
  { de_la: "/blog", la: "/proiecte" },
  {
    de_la: "/2024/11/18/redirectioneaza-35-catre-asociatia-teona-ariana-un-singur-click-pentru-o-diferenta-reala",
    la: "/redirectioneaza-3-5",
  },
  {
    de_la: "/2024/11/16/directioneaza-20-din-impozitul-firmei-catre-asociatia-teona-ariana",
    la: "/directioneaza-20",
  },
  {
    de_la: "/2024/11/18/fii-voluntar-la-asociatia-teona-ariana-bucuria-de-a-schimba-vieti",
    la: "/devino-voluntar",
  },
  {
    de_la: "/2024/11/17/casa-teona-un-loc-al-sperantei-pentru-copiii-cu-dizabilitati",
    la: "/casa-teona",
  },
  // Celelalte două articole sunt povești ale unor copii. Nu le republicăm ca
  // atare — una dintre ele dă numele și diagnosticele unui copil — așa că duc
  // la pagina de proiecte, până când asociația decide ce se publică din ele.
  {
    de_la: "/2025/03/18/dintr-o-inima-de-copil-pentru-inima-de-copil-povestea-stefaniei-fetita-care-a-transformat-creativitatea-in-generozitate",
    la: "/proiecte",
  },
  { de_la: "/2025/04/26/povestea-lui-tudor", la: "/proiecte" },
];
