// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Student, StudentStatus, StudentActivity, StudentMetric, StudentSettingsValues } from './types.js';
export interface StudentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Student>;
    onSubmit: (value: Omit<Student, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function StudentForm({ onSubmit, ...props }: StudentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Student, 'id'>)}/>; }
