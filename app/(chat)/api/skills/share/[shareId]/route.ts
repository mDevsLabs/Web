import { getPublicSkillByShareId } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  const found = await getPublicSkillByShareId({ shareId });
  if (!found) {
    return Response.json(
      { error: "Ce skill partagé est introuvable ou n'est plus public." },
      { status: 404 }
    );
  }

  return Response.json(found);
}
