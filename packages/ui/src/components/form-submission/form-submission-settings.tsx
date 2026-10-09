// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionActivity, FormSubmissionMetric, FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FormSubmissionSettingsValues;
    onChange: (key: keyof FormSubmissionSettingsValues, value: boolean) => void;
}
export function FormSubmissionSettings({ onChange, ...props }: FormSubmissionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof FormSubmissionSettingsValues, value)}/>; }
