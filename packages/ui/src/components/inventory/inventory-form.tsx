// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Inventory, InventoryStatus, InventoryActivity, InventoryMetric, InventorySettingsValues } from './types.js';
export interface InventoryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Inventory>;
    onSubmit: (value: Omit<Inventory, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function InventoryForm({ onSubmit, ...props }: InventoryFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Inventory, 'id'>)}/>; }
