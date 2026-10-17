// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Payroll>;
    onSubmit: (value: Omit<Payroll, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function PayrollForm({ onSubmit, ...props }: PayrollFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Payroll, 'id'>)}/>; }
