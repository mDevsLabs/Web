// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Repository, RepositoryStatus, RepositoryActivity, RepositoryMetric, RepositorySettingsValues } from './types.js';
export interface RepositoryTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly RepositoryActivity[];
    emptyMessage?: string;
}
export function RepositoryTimeline(props: RepositoryTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
