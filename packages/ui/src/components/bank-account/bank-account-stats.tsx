// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BankAccountMetric[];
}
export function BankAccountStats(props: BankAccountStatsProps) { return <DomainStats config={config} {...props}/>; }
