// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Database, DatabaseStatus, DatabaseActivity, DatabaseMetric, DatabaseSettingsValues } from './types.js';
export interface DatabaseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DatabaseMetric[];
}
export function DatabaseStats(props: DatabaseStatsProps) { return <DomainStats config={config} {...props}/>; }
