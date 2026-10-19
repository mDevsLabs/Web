// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly PullRequestActivity[];
    emptyMessage?: string;
}
export function PullRequestTimeline(props: PullRequestTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
