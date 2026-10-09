// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionActivity, FormSubmissionMetric, FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: FormSubmissionStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: FormSubmissionStatus | '') => void;
}
export function FormSubmissionFilters({ onStatusChange, ...props }: FormSubmissionFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as FormSubmissionStatus | '') : undefined}/>; }
