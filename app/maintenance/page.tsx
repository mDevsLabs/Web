import type { Metadata } from "next";
import { connection } from "next/server";
import { MaintenancePanel } from "@/components/maintenance/maintenance-panel";
import { getMaintenanceStatus } from "@/lib/maintenance/maintenance-service";

export const metadata: Metadata = {
  description:
    "mAI Web est actuellement en cours de maintenance ou de mise à niveau. Nos équipes travaillent pour rétablir les services au plus vite.",
  robots: {
    follow: false,
    index: false,
  },
  title: "Maintenance en cours | mAI Web",
};

export default async function MaintenancePage() {
  await connection();
  const status = await getMaintenanceStatus();

  return <MaintenancePanel initialMaintenance={status.currentMaintenance} />;
}
