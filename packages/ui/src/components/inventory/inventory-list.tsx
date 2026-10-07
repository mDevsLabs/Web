// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventoryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Inventory[];
    onSelect?: (item: Inventory) => void;
    emptyMessage?: string;
}
export function InventoryList({ onSelect, ...props }: InventoryListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Inventory) : undefined}/>; }
