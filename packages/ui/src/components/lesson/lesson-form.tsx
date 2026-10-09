// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Lesson, LessonStatus, LessonActivity, LessonMetric, LessonSettingsValues } from './types.js';
export interface LessonFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Lesson>;
    onSubmit: (value: Omit<Lesson, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function LessonForm({ onSubmit, ...props }: LessonFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Lesson, 'id'>)}/>; }
