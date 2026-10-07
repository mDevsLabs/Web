// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function IssueEmptyState(props: IssueEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
