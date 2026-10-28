import type { Metadata, Viewport } from "next";

/**
 * Panoul ca aplicație: manifestul și iconița de pe ecranul telefonului se
 * leagă numai aici, nu în aranjamentul site-ului. Cine instalează site-ul
 * public n-are de ce să primească panoul, și invers.
 */
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Panou Teona",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/panou/icon-512.png" },
};

export const viewport: Viewport = {
  themeColor: "#232323",
};

export default function AranjamentPanou({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
