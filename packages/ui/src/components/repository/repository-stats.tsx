// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly RepositoryMetric[];
}
export function RepositoryStats(props: RepositoryStatsProps) { return <DomainStats config={config} {...props}/>; }
