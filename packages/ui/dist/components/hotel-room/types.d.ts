import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type HotelRoom = {
    id?: string;
    number: string;
    roomType: string;
    nightlyPrice: number;
    capacity: number;
    status: "available" | "occupied" | "maintenance";
};
export type HotelRoomStatus = HotelRoom['status'];
export interface HotelRoomActivity extends DomainActivity {
    hotelroomId?: string;
}
export type HotelRoomMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalHotelRoom' | 'activeHotelRoom' | 'valueHotelRoom';
};
export type HotelRoomSettingsValues = Partial<Record<"notifyHotelRoom" | "archiveHotelRoom" | "approveHotelRoom", boolean>>;
