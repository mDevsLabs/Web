// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Enrollment, EnrollmentStatus, EnrollmentActivity, EnrollmentMetric, EnrollmentSettingsValues } from './types.js';
export interface EnrollmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Enrollment>;
    onSubmit: (value: Omit<Enrollment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function EnrollmentForm({ onSubmit, ...props }: EnrollmentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Enrollment, 'id'>)}/>; }
