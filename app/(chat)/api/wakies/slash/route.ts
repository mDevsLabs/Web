import { json, requireWakiesUser } from "@/lib/wakies/http";
import { suggestSlashCommands } from "@/lib/wakies/slash";

/** Suggestions privées des commandes `/` pendant la saisie d’un message. */
export async function GET(request: Request) {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) return identite;

  const prefixe = new URL(request.url).searchParams.get("q") ?? "";
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(prefixe)) {
    return json(
      { commandes: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const commandes = await suggestSlashCommands(identite.userId, prefixe);
  return json({ commandes }, { headers: { "Cache-Control": "no-store" } });
}
