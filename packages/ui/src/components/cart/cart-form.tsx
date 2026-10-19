// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Cart, CartStatus, CartActivity, CartMetric, CartSettingsValues } from './types.js';
export interface CartFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Cart>;
    onSubmit: (value: Omit<Cart, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function CartForm({ onSubmit, ...props }: CartFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Cart, 'id'>)}/>; }
