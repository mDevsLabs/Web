// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Database[];
    metrics: readonly DatabaseMetric[];
}
export function DatabaseOverview(props: DatabaseOverviewProps) { return <DomainOverview config={config} {...props}/>; }
