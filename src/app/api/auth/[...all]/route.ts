import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";
import { limitByIp } from "@/lib/security/rate-limit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

// Limite par IP les essais de connexion et d'inscription (devinette de mot
// de passe) : la limite intégrée de la librairie vit en mémoire, donc pas
// partagée entre les instances serverless de Vercel.
export async function POST(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.includes("/sign-in/") || pathname.includes("/sign-up/")) {
    const limited = await limitByIp(request, "auth");
    if (limited) {
      return limited;
    }
  }

  return handler.POST(request);
}
