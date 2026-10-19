// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Employee>;
    onSubmit: (value: Omit<Employee, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function EmployeeForm({ onSubmit, ...props }: EmployeeFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Employee, 'id'>)}/>; }
