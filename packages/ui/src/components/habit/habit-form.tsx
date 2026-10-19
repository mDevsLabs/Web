// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Habit, HabitStatus, HabitActivity, HabitMetric, HabitSettingsValues } from './types.js';
export interface HabitFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Habit>;
    onSubmit: (value: Omit<Habit, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function HabitForm({ onSubmit, ...props }: HabitFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Habit, 'id'>)}/>; }
