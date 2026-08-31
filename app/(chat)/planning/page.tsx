import { redirect } from "next/navigation";
import { getMaiUser } from "@/lib/auth/session";
import { getAgentsByUserId, getScheduledMessagesByUserId } from "@/lib/db/queries";
import { PlanningClient } from "./planning-client";

export const metadata = {
  description: "Programmez l'envoi automatique de messages à l'IA avec vos agents et outils préférés.",
  title: "Planification | mAI",
};

export default async function PlanningPage() {
  const user = await getMaiUser();
  if (!user) {
    redirect("/login");
  }

  const userId = user.id || user.email;
  const [initialSchedules, userAgents] = await Promise.all([
    getScheduledMessagesByUserId({ userId }),
    getAgentsByUserId({ userId }),
  ]);

  return (
    <PlanningClient
      initialAgents={userAgents}
      initialSchedules={initialSchedules}
      userId={userId}
    />
  );
}