// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Warehouse[];
    onSelect?: (item: Warehouse) => void;
    emptyMessage?: string;
}
export function WarehouseList({ onSelect, ...props }: WarehouseListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Warehouse) : undefined}/>; }
