import {
  OWNER_COOKIE,
  OWNER_COOKIE_MAX_AGE,
  isOwnerRequest,
  isOwnerSecret,
  ownerCookieValue,
} from "@/lib/security/owner";
import { limitByIp } from "@/lib/security/rate-limit";

const MAX_SECRET_LENGTH = 200;

function ownerCookie(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${OWNER_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

// Indique si ce navigateur est déverrouillé en mode propriétaire, et si la
// protection est configurée (OWNER_SECRET défini) sur ce déploiement.
export async function GET(request: Request) {
  return Response.json({
    isOwner: isOwnerRequest(request),
    configured: process.env.NODE_ENV !== "production" || Boolean(process.env.OWNER_SECRET),
  });
}

// Déverrouille ce navigateur : vérifie le secret, puis pose un cookie signé
// (HttpOnly, invisible du JavaScript de la page). Essais limités par IP.
export async function POST(request: Request) {
  const limited = await limitByIp(request, "owner-unlock");
  if (limited) {
    return limited;
  }

  const body: unknown = await request.json().catch(() => null);
  const secret =
    typeof body === "object" && body !== null && "secret" in body && typeof body.secret === "string"
      ? body.secret.slice(0, MAX_SECRET_LENGTH)
      : "";

  const configuredSecret = process.env.OWNER_SECRET;

  if (!configuredSecret) {
    return Response.json(
      { error: "La protection n'est pas configurée (OWNER_SECRET manquant sur le serveur)." },
      { status: 503 },
    );
  }

  if (!isOwnerSecret(secret)) {
    return Response.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  return Response.json(
    { isOwner: true },
    { headers: { "Set-Cookie": ownerCookie(ownerCookieValue(configuredSecret), OWNER_COOKIE_MAX_AGE) } },
  );
}

// Reverrouille ce navigateur (supprime le cookie).
export async function DELETE() {
  return Response.json({ isOwner: false }, { headers: { "Set-Cookie": ownerCookie("", 0) } });
}
