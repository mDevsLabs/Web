import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance/maintenance-service";

export async function GET() {
  const status = await getMaintenanceStatus();
  return NextResponse.json(status);
}
