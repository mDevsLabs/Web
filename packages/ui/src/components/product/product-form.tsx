// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Product, ProductStatus, ProductActivity, ProductMetric, ProductSettingsValues } from './types.js';
export interface ProductFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Product>;
    onSubmit: (value: Omit<Product, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ProductForm({ onSubmit, ...props }: ProductFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Product, 'id'>)}/>; }
