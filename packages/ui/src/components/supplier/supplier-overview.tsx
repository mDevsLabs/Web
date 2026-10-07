// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Supplier, SupplierStatus, SupplierActivity, SupplierMetric, SupplierSettingsValues } from './types.js';
export interface SupplierOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Supplier[];
    metrics: readonly SupplierMetric[];
}
export function SupplierOverview(props: SupplierOverviewProps) { return <DomainOverview config={config} {...props}/>; }
