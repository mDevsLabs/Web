// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<JobPosting>;
    onSubmit: (value: Omit<JobPosting, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function JobPostingForm({ onSubmit, ...props }: JobPostingFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<JobPosting, 'id'>)}/>; }
