import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
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

async function MaintenanceContent() {
  await connection();
  const status = await getMaintenanceStatus();

  return <MaintenancePanel initialMaintenance={status.currentMaintenance} />;
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenancePanel initialMaintenance={null} />}>
      <MaintenanceContent />
    </Suspense>
  );
}
