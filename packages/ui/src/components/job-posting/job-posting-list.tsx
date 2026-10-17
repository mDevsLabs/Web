// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly JobPosting[];
    onSelect?: (item: JobPosting) => void;
    emptyMessage?: string;
}
export function JobPostingList({ onSelect, ...props }: JobPostingListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as JobPosting) : undefined}/>; }
