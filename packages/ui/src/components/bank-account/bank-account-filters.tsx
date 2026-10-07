// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BankAccountStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BankAccountStatus | '') => void;
}
export function BankAccountFilters({ onStatusChange, ...props }: BankAccountFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as BankAccountStatus | '') : undefined}/>; }
