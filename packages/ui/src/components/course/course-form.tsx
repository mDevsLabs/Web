// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Course, CourseStatus, CourseActivity, CourseMetric, CourseSettingsValues } from './types.js';
export interface CourseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Course>;
    onSubmit: (value: Omit<Course, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CourseForm({ onSubmit, ...props }: CourseFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Course, 'id'>)}/>; }
