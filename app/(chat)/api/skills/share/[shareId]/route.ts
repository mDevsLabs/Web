import { errorResponse } from "@/lib/api/error-response";
import { getPublicSkillByShareId } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  const found = await getPublicSkillByShareId({ shareId });
  if (!found) {
    return errorResponse("not_found", {
      message: "Ce skill partagé est introuvable ou n'est plus public.",
    });
  }

  return Response.json(found);
}
