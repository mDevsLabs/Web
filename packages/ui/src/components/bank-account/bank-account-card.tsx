// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: BankAccount;
}
export function BankAccountCard(props: BankAccountCardProps) { return <DomainCard config={config} {...props}/>; }
