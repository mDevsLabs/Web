// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderActivity, PurchaseOrderMetric, PurchaseOrderSettingsValues } from './types.js';
export interface PurchaseOrderFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<PurchaseOrder>;
    onSubmit: (value: Omit<PurchaseOrder, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function PurchaseOrderForm({ onSubmit, ...props }: PurchaseOrderFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<PurchaseOrder, 'id'>)}/>; }
