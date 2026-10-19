// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Goal, GoalStatus, GoalActivity, GoalMetric, GoalSettingsValues } from './types.js';
export interface GoalFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Goal>;
    onSubmit: (value: Omit<Goal, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function GoalForm({ onSubmit, ...props }: GoalFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Goal, 'id'>)}/>; }
