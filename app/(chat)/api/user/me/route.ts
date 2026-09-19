import { getMaiUser } from "@/lib/auth/session";

// Point de contrôle de session léger (utilisé par la page /projects/join pour
// savoir si un utilisateur est connecté avant de proposer le bouton rejoindre).
export async function GET() {
  const user = await getMaiUser();
  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({
    authenticated: true,
    email: user.email,
    id: user.id,
  });
}
