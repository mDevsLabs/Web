// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly PullRequestMetric[];
}
export function PullRequestStats(props: PullRequestStatsProps) { return <DomainStats config={config} {...props}/>; }
