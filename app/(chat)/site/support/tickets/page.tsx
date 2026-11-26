import { Suspense } from "react";
import { getTicketsList } from "@/app/(chat)/site/actions/support";
import { TicketsListSkeleton } from "@/components/site/support/SupportSkeletons";
import TicketsListClient from "./TicketsListClient";

async function TicketsListLoader() {
  const initialResult = await getTicketsList({ status: "all" });
  return <TicketsListClient initialResult={initialResult} />;
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketsListSkeleton />}>
      <TicketsListLoader />
    </Suspense>
  );
}
