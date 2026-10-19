// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payroll, PayrollStatus, PayrollActivity, PayrollMetric, PayrollSettingsValues } from './types.js';
export interface PayrollSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PayrollSettingsValues;
    onChange: (key: keyof PayrollSettingsValues, value: boolean) => void;
}
export function PayrollSettings({ onChange, ...props }: PayrollSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof PayrollSettingsValues, value)}/>; }
