// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Customer[];
    metrics: readonly CustomerMetric[];
}
export function CustomerOverview(props: CustomerOverviewProps) { return <DomainOverview config={config} {...props}/>; }
