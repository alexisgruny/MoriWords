// Message d'erreur renvoyé par une route API (champ { error }), sinon le
// message de repli : pour que l'interface dise pourquoi une action a échoué
// (ex. "Connecte-toi pour continuer.") au lieu d'un "a échoué" générique.
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Corps vide ou non JSON : le message de repli suffit.
  }

  return fallback;
}
