// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Checkout, CheckoutStatus, CheckoutActivity, CheckoutMetric, CheckoutSettingsValues } from './types.js';
export interface CheckoutFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Checkout>;
    onSubmit: (value: Omit<Checkout, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CheckoutForm({ onSubmit, ...props }: CheckoutFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Checkout, 'id'>)}/>; }
