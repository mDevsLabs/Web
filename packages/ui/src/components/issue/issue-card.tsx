// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Issue;
}
export function IssueCard(props: IssueCardProps) { return <DomainCard config={config} {...props}/>; }
