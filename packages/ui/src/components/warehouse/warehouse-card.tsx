// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Warehouse;
}
export function WarehouseCard(props: WarehouseCardProps) { return <DomainCard config={config} {...props}/>; }
