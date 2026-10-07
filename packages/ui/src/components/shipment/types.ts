import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Shipment = {
    id?: string;
    trackingNumber: string;
    carrier: string;
    destination: string;
    expectedOn: string;
    status: "preparing" | "in-transit" | "delivered" | "delayed";
};
export type ShipmentStatus = Shipment['status'];
export interface ShipmentActivity extends DomainActivity {
    shipmentId?: string;
}
export type ShipmentMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalShipment' | 'activeShipment' | 'valueShipment';
};
export type ShipmentSettingsValues = Partial<Record<"notifyShipment" | "archiveShipment" | "approveShipment", boolean>>;
