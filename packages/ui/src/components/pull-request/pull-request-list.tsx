// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PullRequest, PullRequestStatus, PullRequestActivity, PullRequestMetric, PullRequestSettingsValues } from './types.js';
export interface PullRequestListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly PullRequest[];
    onSelect?: (item: PullRequest) => void;
    emptyMessage?: string;
}
export function PullRequestList({ onSelect, ...props }: PullRequestListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as PullRequest) : undefined}/>; }
