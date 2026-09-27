import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Shippori_Mincho } from "next/font/google";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

// Texte courant : sans-serif à l'esprit « manuel technique ». Les kanji
// retombent sur la police japonaise du système (voir --font-body dans globals.css).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

// Titres et texte japonais : mincho, comme un livre imprimé. Seuls les
// glyphes latins sont embarqués ; les kanji utilisent la mincho du système.
const mincho = Shippori_Mincho({
  variable: "--font-mincho",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
});

// Chiffres, dates et niveaux (tabulaires).
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

// Titre et description affichés dans l'onglet du navigateur et les moteurs de recherche.
export const metadata: Metadata = {
  title: "MoriWords",
  description: "Analyse et mémorisation du japonais, mot par mot.",
};

// Mise en page commune à toutes les pages du site : polices, barre de
// navigation en haut, puis le contenu propre à chaque page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${mincho.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Nav />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
