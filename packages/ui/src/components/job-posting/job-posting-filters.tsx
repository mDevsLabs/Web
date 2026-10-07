// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: JobPostingStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: JobPostingStatus | '') => void;
}
export function JobPostingFilters({ onStatusChange, ...props }: JobPostingFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as JobPostingStatus | '') : undefined}/>; }
