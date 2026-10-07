// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Supplier, SupplierStatus, SupplierActivity, SupplierMetric, SupplierSettingsValues } from './types.js';
export interface SupplierFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Supplier>;
    onSubmit: (value: Omit<Supplier, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function SupplierForm({ onSubmit, ...props }: SupplierFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Supplier, 'id'>)}/>; }
