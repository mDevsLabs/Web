// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventoryCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Inventory;
}
export function InventoryCard(props: InventoryCardProps) { return <DomainCard config={config} {...props}/>; }
