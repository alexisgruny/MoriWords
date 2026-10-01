import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { ServiceWorker } from "@/components/service-worker";
import { ToastProvider } from "@/components/toast-provider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Texte courant : sans-serif à terminaisons arrondies, chaleureuse et très lisible.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
});

// Japonais : police gothique déjà installée sur l'appareil (--font-jp dans
// globals.css). Noto Sans JP en police web ajoutait 373 déclarations
// @font-face (284 Ko de CSS bloquant) et jusqu'à 1,8 s de calcul de style
// sur téléphone, pour un rendu quasi identique.

// Titre et description affichés dans l'onglet du navigateur et les moteurs de recherche.
export const metadata: Metadata = {
  // Base des liens absolus (aperçus de partage, image opengraph-image.tsx).
  metadataBase: new URL(SITE_URL),
  title: "MoriWords",
  description: "Analyse et mémorisation du japonais, mot par mot.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "MoriWords",
    title: "MoriWords · Tes animes deviennent tes cours de japonais",
    description: "Colle une réplique d'anime : chaque mot expliqué en français, et des fiches de révision créées toutes seules.",
  },
  // Installée sur l'écran d'accueil d'un iPhone : plein écran, avec ce nom
  // sous l'icône (src/app/apple-icon.png).
  appleWebApp: { capable: true, title: "MoriWords", statusBarStyle: "default" },
};

// Couleur de la barre du navigateur / du système, selon le thème.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#171512" },
  ],
};

// Lit le thème choisi explicitement (localStorage) avant le premier rendu,
// pour éviter un flash clair->sombre au chargement. Sans choix mémorisé, la
// préférence système s'applique directement via CSS (@media prefers-color-scheme,
// voir globals.css), sans avoir besoin de ce script.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

// Mise en page commune à toutes les pages du site : polices, barre de
// navigation en haut, puis le contenu propre à chaque page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${nunito.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorker />
        <ToastProvider>
          <Nav />
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
