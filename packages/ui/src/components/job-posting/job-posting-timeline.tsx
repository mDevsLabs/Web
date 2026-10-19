// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly JobPostingActivity[];
    emptyMessage?: string;
}
export function JobPostingTimeline(props: JobPostingTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
