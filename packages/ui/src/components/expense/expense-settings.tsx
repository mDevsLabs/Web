// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Expense, ExpenseStatus, ExpenseActivity, ExpenseMetric, ExpenseSettingsValues } from './types.js';
export interface ExpenseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ExpenseSettingsValues;
    onChange: (key: keyof ExpenseSettingsValues, value: boolean) => void;
}
export function ExpenseSettings({ onChange, ...props }: ExpenseSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof ExpenseSettingsValues, value)}/>; }
