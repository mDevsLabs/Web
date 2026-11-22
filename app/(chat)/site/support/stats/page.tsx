import { Suspense } from "react";
import { getSupportStats } from "@/app/(chat)/site/actions/support";
import { SupportStatsSkeleton } from "@/components/site/support/SupportSkeletons";
import SupportStatsClient from "./SupportStatsClient";

async function SupportStatsLoader() {
  const initialResult = await getSupportStats();
  return <SupportStatsClient initialResult={initialResult} />;
}

export default function SupportStatsPage() {
  return (
    <Suspense fallback={<SupportStatsSkeleton />}>
      <SupportStatsLoader />
    </Suspense>
  );
}
