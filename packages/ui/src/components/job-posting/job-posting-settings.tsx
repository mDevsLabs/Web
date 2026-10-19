// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { JobPosting, JobPostingStatus, JobPostingActivity, JobPostingMetric, JobPostingSettingsValues } from './types.js';
export interface JobPostingSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: JobPostingSettingsValues;
    onChange: (key: keyof JobPostingSettingsValues, value: boolean) => void;
}
export function JobPostingSettings({ onChange, ...props }: JobPostingSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof JobPostingSettingsValues, value)}/>; }
