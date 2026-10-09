// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Supplier, SupplierStatus, SupplierActivity, SupplierMetric, SupplierSettingsValues } from './types.js';
export interface SupplierTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly SupplierActivity[];
    emptyMessage?: string;
}
export function SupplierTimeline(props: SupplierTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
