// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { FormSubmission, FormSubmissionStatus, FormSubmissionActivity, FormSubmissionMetric, FormSubmissionSettingsValues } from './types.js';
export interface FormSubmissionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<FormSubmission>;
    onSubmit: (value: Omit<FormSubmission, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function FormSubmissionForm({ onSubmit, ...props }: FormSubmissionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<FormSubmission, 'id'>)}/>; }
