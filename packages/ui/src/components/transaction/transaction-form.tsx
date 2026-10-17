// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Transaction, TransactionStatus, TransactionActivity, TransactionMetric, TransactionSettingsValues } from './types.js';
export interface TransactionFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Transaction>;
    onSubmit: (value: Omit<Transaction, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function TransactionForm({ onSubmit, ...props }: TransactionFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Transaction, 'id'>)}/>; }
