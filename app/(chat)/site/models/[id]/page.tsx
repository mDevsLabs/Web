import { notFound } from "next/navigation";
import { getModelById, getModels } from "@/lib/site/models";
import { ModelDetailClient } from "./ModelDetailClient";

export async function generateStaticParams() {
  const models = getModels();
  return models.map((model) => ({
    id: model.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const model = getModelById(resolvedParams.id);
  if (!model) {
    return {
      title: "Modèle Introuvable | mAI",
    };
  }
  return {
    description: model.tagline,
    title: `${model.name} - Modèle IA | mAI`,
  };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const model = getModelById(resolvedParams.id);

  if (!model) {
    notFound();
  }

  return <ModelDetailClient model={model} />;
}
