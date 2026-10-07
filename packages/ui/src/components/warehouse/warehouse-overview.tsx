// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Warehouse[];
    metrics: readonly WarehouseMetric[];
}
export function WarehouseOverview(props: WarehouseOverviewProps) { return <DomainOverview config={config} {...props}/>; }
