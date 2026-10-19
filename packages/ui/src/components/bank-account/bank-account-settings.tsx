// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BankAccountSettingsValues;
    onChange: (key: keyof BankAccountSettingsValues, value: boolean) => void;
}
export function BankAccountSettings({ onChange, ...props }: BankAccountSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BankAccountSettingsValues, value)}/>; }
