import type { Metadata } from "next";
import { Nunito, Noto_Sans_JP } from "next/font/google";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

// Texte courant : sans-serif à terminaisons arrondies, chaleureuse et très lisible.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
});

// Japonais : gothique (sans empattement), plus lisible qu'une mincho pour un
// débutant qui doit distinguer chaque trait. Les kanji sont chargés par tranches
// à la demande, d'où preload désactivé.
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  preload: false,
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
      className={`${nunito.variable} ${notoSansJp.variable} h-full antialiased`}
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
