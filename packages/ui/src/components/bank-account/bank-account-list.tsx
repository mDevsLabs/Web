// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BankAccount[];
    onSelect?: (item: BankAccount) => void;
    emptyMessage?: string;
}
export function BankAccountList({ onSelect, ...props }: BankAccountListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as BankAccount) : undefined}/>; }
