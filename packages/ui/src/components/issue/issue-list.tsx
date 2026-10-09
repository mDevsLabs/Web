// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Issue[];
    onSelect?: (item: Issue) => void;
    emptyMessage?: string;
}
export function IssueList({ onSelect, ...props }: IssueListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Issue) : undefined}/>; }
