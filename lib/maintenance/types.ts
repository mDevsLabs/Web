export interface MaintenanceRecord {
  accessCode: string;
  createdAt: string;
  description: string;
  endAt: string;
  id: string;
  isActive: boolean;
  name: string;
  startAt: string;
  updatedAt: string;
}

export type MaintenancePhase =
  | "in_progress"
  | "scheduled"
  | "completed"
  | "cancelled";

export interface MaintenanceStatusResponse {
  currentMaintenance: {
    description: string;
    endAt: string;
    id: string;
    name: string;
    phase: MaintenancePhase;
    startAt: string;
  } | null;
  isUnderMaintenance: boolean;
  serverTime: string;
}

export interface CreateMaintenanceInput {
  accessCode?: string;
  description?: string;
  endAt: Date;
  name: string;
  startAt?: Date;
}
