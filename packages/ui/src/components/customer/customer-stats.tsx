// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CustomerMetric[];
}
export function CustomerStats(props: CustomerStatsProps) { return <DomainStats config={config} {...props}/>; }
