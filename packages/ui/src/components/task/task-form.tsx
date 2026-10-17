// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Task, TaskStatus, TaskActivity, TaskMetric, TaskSettingsValues } from './types.js';
export interface TaskFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Task>;
    onSubmit: (value: Omit<Task, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TaskForm({ onSubmit, ...props }: TaskFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Task, 'id'>)}/>; }
