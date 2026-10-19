// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Workout, WorkoutStatus, WorkoutActivity, WorkoutMetric, WorkoutSettingsValues } from './types.js';
export interface WorkoutFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Workout>;
    onSubmit: (value: Omit<Workout, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function WorkoutForm({ onSubmit, ...props }: WorkoutFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Workout, 'id'>)}/>; }
