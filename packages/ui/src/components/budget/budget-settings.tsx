// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Budget, BudgetStatus, BudgetActivity, BudgetMetric, BudgetSettingsValues } from './types.js';
export interface BudgetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BudgetSettingsValues;
    onChange: (key: keyof BudgetSettingsValues, value: boolean) => void;
}
export function BudgetSettings({ onChange, ...props }: BudgetSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BudgetSettingsValues, value)}/>; }
