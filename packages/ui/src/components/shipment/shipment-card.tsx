// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Shipment;
}
export function ShipmentCard(props: ShipmentCardProps) { return <DomainCard config={config} {...props}/>; }
