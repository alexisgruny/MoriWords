import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

// Toutes les routes de Better Auth (inscription, connexion, Google,
// déconnexion, session) passent par ce point d'entrée : /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
