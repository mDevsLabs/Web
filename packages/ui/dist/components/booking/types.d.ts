import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Booking = {
    id?: string;
    reference: string;
    customer: string;
    scheduledOn: string;
    durationMinutes: number;
    status: "pending" | "confirmed" | "cancelled" | "completed";
};
export type BookingStatus = Booking['status'];
export interface BookingActivity extends DomainActivity {
    bookingId?: string;
}
export type BookingMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalBooking' | 'activeBooking' | 'valueBooking';
};
export type BookingSettingsValues = Partial<Record<"notifyBooking" | "archiveBooking" | "approveBooking", boolean>>;
