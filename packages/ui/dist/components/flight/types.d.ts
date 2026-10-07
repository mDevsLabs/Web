import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Flight = {
    id?: string;
    number: string;
    origin: string;
    destination: string;
    departsOn: string;
    status: "scheduled" | "boarding" | "departed" | "delayed";
};
export type FlightStatus = Flight['status'];
export interface FlightActivity extends DomainActivity {
    flightId?: string;
}
export type FlightMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalFlight' | 'activeFlight' | 'valueFlight';
};
export type FlightSettingsValues = Partial<Record<"notifyFlight" | "archiveFlight" | "approveFlight", boolean>>;
