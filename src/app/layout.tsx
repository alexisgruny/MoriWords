import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/nav";
import "./globals.css";

// Police de texte principale du site.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Police à chasse fixe, utilisée pour le texte technique si besoin.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
