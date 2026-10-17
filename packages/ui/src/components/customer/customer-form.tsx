// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Customer, CustomerStatus, CustomerActivity, CustomerMetric, CustomerSettingsValues } from './types.js';
export interface CustomerFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Customer>;
    onSubmit: (value: Omit<Customer, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CustomerForm({ onSubmit, ...props }: CustomerFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Customer, 'id'>)}/>; }
