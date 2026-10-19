// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Warehouse, WarehouseStatus, WarehouseActivity, WarehouseMetric, WarehouseSettingsValues } from './types.js';
export interface WarehouseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function WarehouseEmptyState(props: WarehouseEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
