import { Suspense } from "react";
import { getTicketDetails } from "@/app/(chat)/site/actions/support";
import { TicketDetailSkeleton } from "@/components/site/support/SupportSkeletons";
import TicketDetailClient from "./TicketDetailClient";

async function TicketDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialDetails = await getTicketDetails(id);
  return <TicketDetailClient initialDetails={initialDetails} ticketId={id} />;
}

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<TicketDetailSkeleton />}>
      <TicketDetailLoader params={params} />
    </Suspense>
  );
}
