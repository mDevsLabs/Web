// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Order, OrderStatus, OrderActivity, OrderMetric, OrderSettingsValues } from './types.js';
export interface OrderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Order>;
    onSubmit: (value: Omit<Order, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function OrderForm({ onSubmit, ...props }: OrderFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Order, 'id'>)}/>; }
