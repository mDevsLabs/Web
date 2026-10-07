// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Issue, IssueStatus, IssueActivity, IssueMetric, IssueSettingsValues } from './types.js';
export interface IssueOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Issue[];
    metrics: readonly IssueMetric[];
}
export function IssueOverview(props: IssueOverviewProps) { return <DomainOverview config={config} {...props}/>; }
