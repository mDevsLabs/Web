// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Expense>;
    onSubmit: (value: Omit<Expense, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ExpenseForm({ onSubmit, ...props }: ExpenseFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Expense, 'id'>)}/>; }
