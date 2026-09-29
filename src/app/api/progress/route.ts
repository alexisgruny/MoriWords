import { requireUser } from "@/lib/auth/session";
import { getJlptProgress } from "@/lib/progress/jlpt-progress";

// Progression dans le vocabulaire JLPT, niveau par niveau.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    return Response.json({ levels: await getJlptProgress(user.id) });
  } catch (error) {
    console.error("Failed to load JLPT progress:", error);
    return Response.json({ error: "Impossible de calculer ta progression." }, { status: 500 });
  }
}
