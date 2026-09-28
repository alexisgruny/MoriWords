// Page où revenir après connexion (paramètre ?suivant=). Seuls les chemins
// internes sont acceptés : "//site.com" ou "/\site.com" enverraient vers un
// autre domaine (redirection ouverte).
export function safeRedirectPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;

  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return "/";
  }

  return path;
}
