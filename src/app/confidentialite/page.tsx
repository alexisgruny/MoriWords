import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Confidentialité · MoriWords" };

// Politique de confidentialité (RGPD). À tenir à jour si une nouvelle donnée
// est collectée ou un nouveau prestataire ajouté.
const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "Ce que MoriWords enregistre",
    paragraphs: [
      "Ton compte : le nom ou pseudo choisi, ton adresse email et ton mot de passe, stocké uniquement sous forme chiffrée (haché). Si tu te connectes avec Google, MoriWords reçoit ton nom, ton email et ta photo de profil Google.",
      "Tes sessions de connexion : un cookie de session, l'adresse IP et le navigateur utilisés, pour garder ta connexion active et pouvoir la sécuriser.",
      "Ce que tu crées : les textes analysés, tes decks, cartes et historique de révision, ton vocabulaire et tes réponses aux exercices.",
      "Le suivi des coûts : pour chaque génération par l'intelligence artificielle, le nombre de tokens consommés et le type d'action, rattachés à ton compte.",
      "La protection contre les abus : des compteurs de requêtes par adresse IP, effacés automatiquement après 2 jours.",
    ],
  },
  {
    title: "Pourquoi",
    paragraphs: [
      "Uniquement pour faire fonctionner le service que tu utilises (base légale : l'exécution du service) et le protéger contre les abus (intérêt légitime). Aucune publicité, aucune revente, aucun profilage.",
    ],
  },
  {
    title: "Qui y a accès",
    paragraphs: [
      "Vercel (hébergement du site) et Neon (base de données PostgreSQL), qui stockent les données pour le compte de MoriWords.",
      "Anthropic (Claude) : les mots et phrases à traduire, et tes réponses aux exercices à corriger, lui sont envoyés, sans ton nom ni ton email. Anthropic n'utilise pas les données reçues par son API pour entraîner ses modèles.",
      "Google, seulement si tu choisis de te connecter avec Google.",
      "Certains de ces prestataires sont situés aux États-Unis ; les transferts s'appuient sur les clauses contractuelles types de la Commission européenne.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Uniquement les cookies nécessaires à la connexion (ta session). Ton choix de thème clair ou sombre reste dans le stockage local de ton navigateur, sans être envoyé au serveur. Aucun cookie publicitaire ni de mesure d'audience, d'où l'absence de bandeau.",
    ],
  },
  {
    title: "Combien de temps",
    paragraphs: [
      "Tant que ton compte existe. Quand tu le supprimes, tout ce qui lui est rattaché est effacé immédiatement ; seul le suivi des coûts garde des compteurs de tokens anonymes (détachés de tout compte).",
    ],
  },
  {
    title: "Tes droits",
    paragraphs: [
      "Tu peux à tout moment télécharger toutes tes données ou supprimer ton compte depuis la page Mon compte. Pour toute autre demande (rectification, opposition, question), écris via la page de contact indiquée dans les mentions légales. Tu peux aussi saisir la CNIL (cnil.fr).",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="fade-in-up mb-6">
          <h1 className="text-[var(--ink)]">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Dernière mise à jour : 28 septembre 2026.</p>
        </header>
        <article className="panel flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-[var(--ink)]">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-[var(--ink)]">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <p className="text-sm text-[var(--muted)]">
            Voir aussi les{" "}
            <Link href="/mentions-legales" className="underline hover:text-[var(--ink)]">
              mentions légales
            </Link>{" "}
            et la page{" "}
            <Link href="/compte" className="underline hover:text-[var(--ink)]">
              Mon compte
            </Link>
            .
          </p>
        </article>
      </div>
    </main>
  );
}
