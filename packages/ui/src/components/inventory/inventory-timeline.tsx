// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventoryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly InventoryActivity[];
    emptyMessage?: string;
}
export function InventoryTimeline(props: InventoryTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
