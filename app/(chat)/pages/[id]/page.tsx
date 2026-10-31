import { PageWorkspace } from "@/components/pages/page-workspace";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PageWorkspace pageId={id} />;
}
