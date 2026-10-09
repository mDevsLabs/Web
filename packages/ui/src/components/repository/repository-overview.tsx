// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Repository[];
    metrics: readonly RepositoryMetric[];
}
export function RepositoryOverview(props: RepositoryOverviewProps) { return <DomainOverview config={config} {...props}/>; }
