import { z } from "zod";
export const pageReviewSchema = z
  .object({
    content: z.string().min(1).max(20_000),
    spaceId: z.string().min(1),
    title: z.string().trim().min(1).max(160),
  })
  .strict();
export const pageReviewTool = {
  description:
    "Present a Markdown draft for human review before saving it into an authorized Space. The user can approve and save, or decline. Do not create the page yourself after this tool: its approved result includes the saved page URL. Call once, then wait for the review result.",
  name: "review_space_page",
  parameters: z.toJSONSchema(pageReviewSchema),
};
