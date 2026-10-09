// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Shipment, ShipmentStatus, ShipmentActivity, ShipmentMetric, ShipmentSettingsValues } from './types.js';
export interface ShipmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function ShipmentEmptyState(props: ShipmentEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
