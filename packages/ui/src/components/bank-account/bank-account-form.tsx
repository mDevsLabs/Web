// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BankAccount, BankAccountStatus, BankAccountActivity, BankAccountMetric, BankAccountSettingsValues } from './types.js';
export interface BankAccountFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BankAccount>;
    onSubmit: (value: Omit<BankAccount, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BankAccountForm({ onSubmit, ...props }: BankAccountFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<BankAccount, 'id'>)}/>; }
