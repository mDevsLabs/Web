import { connection } from "next/server";
import { Suspense } from "react";
import { getSupportStats } from "@/app/(chat)/site/actions/support";
import { SupportStatsSkeleton } from "@/components/site/support/SupportSkeletons";
import SupportStatsClient from "./SupportStatsClient";

async function SupportStatsLoader() {
  await connection();

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
