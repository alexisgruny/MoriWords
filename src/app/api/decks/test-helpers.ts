// Fabrique une requête JSON pour appeler un handler de route directement dans
// les tests d'intégration (sans passer par un serveur HTTP). Partagé par les
// tests decks/cards de ce dossier, qui appelaient tous la même chose en double.
export function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
