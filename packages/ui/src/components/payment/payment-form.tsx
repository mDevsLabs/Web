// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Payment, PaymentStatus, PaymentActivity, PaymentMetric, PaymentSettingsValues } from './types.js';
export interface PaymentFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Payment>;
    onSubmit: (value: Omit<Payment, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function PaymentForm({ onSubmit, ...props }: PaymentFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Payment, 'id'>)}/>; }
