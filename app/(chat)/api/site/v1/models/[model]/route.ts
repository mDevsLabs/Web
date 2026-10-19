import { type NextRequest, NextResponse } from "next/server";
import { authenticateOpenAIRequest } from "@/lib/site/openai-auth";
import { getOpenAIModelsList } from "@/lib/site/openai-model-mapper";
import type {
  OpenAIErrorResponse,
  OpenAIModelObject,
} from "@/lib/site/openai-types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const auth = await authenticateOpenAIRequest(req);
  if (!auth.valid) {
    return auth.response;
  }

  const { model: requestedModel } = await params;
  const modelsList = getOpenAIModelsList();

  const found = modelsList.find(
    (m) => m.id.toLowerCase() === requestedModel.toLowerCase()
  );

  if (!found) {
    return NextResponse.json<OpenAIErrorResponse>(
      {
        error: {
          code: "model_not_found",
          message: `The model '${requestedModel}' does not exist.`,
          param: "model",
          type: "invalid_request_error",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json<OpenAIModelObject>(found);
}
