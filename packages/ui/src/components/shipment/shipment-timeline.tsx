// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly ShipmentActivity[];
    emptyMessage?: string;
}
export function ShipmentTimeline(props: ShipmentTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
