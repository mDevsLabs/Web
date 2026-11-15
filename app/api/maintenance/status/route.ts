import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance/maintenance-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getMaintenanceStatus();
  return NextResponse.json(status);
}
