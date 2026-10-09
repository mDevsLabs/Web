// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TransactionSettingsValues;
    onChange: (key: keyof TransactionSettingsValues, value: boolean) => void;
}
export function TransactionSettings({ onChange, ...props }: TransactionSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof TransactionSettingsValues, value)}/>; }
