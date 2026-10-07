// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainOverview, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionActivity, FormSubmissionMetric, FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FormSubmission[];
    metrics: readonly FormSubmissionMetric[];
}
export function FormSubmissionOverview(props: FormSubmissionOverviewProps) { return <DomainOverview config={config} {...props}/>; }
