// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Exam, ExamStatus, ExamActivity, ExamMetric, ExamSettingsValues } from './types.js';
export interface ExamFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Exam>;
    onSubmit: (value: Omit<Exam, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ExamForm({ onSubmit, ...props }: ExamFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Exam, 'id'>)}/>; }
