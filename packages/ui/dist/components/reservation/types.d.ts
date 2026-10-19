import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Reservation = {
    id?: string;
    reference: string;
    guest: string;
    checkIn: string;
    checkOut: string;
    status: "pending" | "confirmed" | "checked-in" | "completed";
};
export type ReservationStatus = Reservation['status'];
export interface ReservationActivity extends DomainActivity {
    reservationId?: string;
}
export type ReservationMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalReservation' | 'activeReservation' | 'valueReservation';
};
export type ReservationSettingsValues = Partial<Record<"notifyReservation" | "archiveReservation" | "approveReservation", boolean>>;
