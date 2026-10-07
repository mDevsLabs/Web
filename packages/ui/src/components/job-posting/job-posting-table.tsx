// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly JobPosting[];
    emptyMessage?: string;
}
export function JobPostingTable(props: JobPostingTableProps) { return <DomainTable config={config} {...props}/>; }
