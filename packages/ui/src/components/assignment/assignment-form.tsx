// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Assignment, AssignmentStatus, AssignmentActivity, AssignmentMetric, AssignmentSettingsValues } from './types.js';
export interface AssignmentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Assignment>;
    onSubmit: (value: Omit<Assignment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function AssignmentForm({ onSubmit, ...props }: AssignmentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Assignment, 'id'>)}/>; }
