import { connection, NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance/maintenance-service";

export async function GET() {
  await connection();
  const status = await getMaintenanceStatus();
  return NextResponse.json(status);
}
