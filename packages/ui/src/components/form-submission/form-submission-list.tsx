// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionActivity, FormSubmissionMetric, FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly FormSubmission[];
    onSelect?: (item: FormSubmission) => void;
    emptyMessage?: string;
}
export function FormSubmissionList({ onSelect, ...props }: FormSubmissionListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as FormSubmission) : undefined}/>; }
