import { createAuthClient } from "better-auth/react";

// Client navigateur de Better Auth (inscription, connexion, session). Même
// origine que le site, donc pas besoin de baseURL.
export const authClient = createAuthClient();
