import { getMaiUser } from "@/lib/auth/session";
import { purgeMcpLogs } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const json = await request.json().catch(() => ({}));
  const raw = json.retentionDays ?? json.olderThanDays ?? 0;
  // `Number("abc")` vaut NaN, et `NaN <= 0` est false : le clamp laissait donc
  // passer NaN jusqu'au paramètre de requête. On refuse tout ce qui n'est pas
  // un nombre fini, en amont du bornage.
  const days = Number(raw);
  if (!Number.isFinite(days)) {
    return new ChatbotError("bad_request:api").toResponse();
  }
  // 0 ou négatif = purge totale ; sinon borné entre 1 et 50 jours
  const safe = days <= 0 ? 0 : Math.min(Math.max(Math.floor(days), 1), 50);
  const res = await purgeMcpLogs({ olderThanDays: safe, userId });
  return Response.json({ deleted: res.deleted, retentionDays: safe });
}
