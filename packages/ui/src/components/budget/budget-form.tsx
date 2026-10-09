// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Budget>;
    onSubmit: (value: Omit<Budget, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BudgetForm({ onSubmit, ...props }: BudgetFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Budget, 'id'>)}/>; }
