// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shipment[];
    onSelect?: (item: Shipment) => void;
    emptyMessage?: string;
}
export function ShipmentList({ onSelect, ...props }: ShipmentListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Shipment) : undefined}/>; }
