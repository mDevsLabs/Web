// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function PullRequestEmptyState(props: PullRequestEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
