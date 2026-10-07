// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventoryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Inventory[];
    emptyMessage?: string;
}
export function InventoryTable(props: InventoryTableProps) { return <DomainTable config={config} {...props}/>; }
