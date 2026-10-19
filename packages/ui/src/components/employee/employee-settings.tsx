// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Employee, EmployeeStatus, EmployeeActivity, EmployeeMetric, EmployeeSettingsValues } from './types.js';
export interface EmployeeSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: EmployeeSettingsValues;
    onChange: (key: keyof EmployeeSettingsValues, value: boolean) => void;
}
export function EmployeeSettings({ onChange, ...props }: EmployeeSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof EmployeeSettingsValues, value)}/>; }
