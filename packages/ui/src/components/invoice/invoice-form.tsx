// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Invoice, InvoiceStatus, InvoiceActivity, InvoiceMetric, InvoiceSettingsValues } from './types.js';
export interface InvoiceFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Invoice>;
    onSubmit: (value: Omit<Invoice, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function InvoiceForm({ onSubmit, ...props }: InvoiceFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Invoice, 'id'>)}/>; }
