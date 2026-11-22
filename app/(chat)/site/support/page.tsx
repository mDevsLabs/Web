import { connection } from "next/server";
import { Suspense } from "react";
import { getSupportDashboardData } from "@/app/(chat)/site/actions/support";
import { SupportDashboardSkeleton } from "@/components/site/support/SupportSkeletons";
import { getSupportStatus } from "@/lib/site/support-status";
import SupportDashboardClient from "./SupportDashboardClient";

async function SupportDashboardLoader() {
  await connection();

  const [initialDashboard, initialStatus] = await Promise.all([
    getSupportDashboardData(),
    getSupportStatus(),
  ]);

  return (
    <SupportDashboardClient
      initialDashboard={initialDashboard}
      initialStatus={initialStatus}
    />
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<SupportDashboardSkeleton />}>
      <SupportDashboardLoader />
    </Suspense>
  );
}
